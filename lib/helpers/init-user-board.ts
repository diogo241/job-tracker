import connectDB from '../db';
import { Board, Column } from '../models';

const DEFAULT_COLUMNS = [
  {
    name: 'Wish List',
    order: 0,
  },
  {
    name: 'Applied',
    order: 1,
  },
  {
    name: 'Interviewing',
    order: 2,
  },
  {
    name: 'Offer',
    order: 3,
  },
  {
    name: 'Rejected',
    order: 4,
  },
];

export async function initUserBoard(userId: string) {
  try {
    await connectDB();

    // Check if the user has a board
    const existingBoard = await Board.findOne({ userId, name: 'My Board' });

    if (existingBoard) return existingBoard;

    // Create a new board
    const board = await Board.create({
      name: 'My Board',
      userId,
      columns: [],
    });

    // Create default columns
    const columns = await Promise.all(
      DEFAULT_COLUMNS.map((col) =>
        Column.create({
          name: col.name,
          order: col.order,
          boardId: board._id,
          jobApplication: [],
        }),
      ),
    );

    // Update the board with the new column IDs
    board.columns = columns.map((col) => col._id);
    await board.save();

    return board;
  } catch (error) {
    throw error;
  }
}
