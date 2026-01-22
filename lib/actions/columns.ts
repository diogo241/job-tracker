'use server';

import { revalidatePath } from 'next/cache';
import { formatData } from '../helpers/format-data';
import { Board, Column, JobApplication } from '../models';
import connectDB from '../db';
import { getSession } from '../auth/auth';

interface Column {
  name: string;
  boardId: string;
}

// Add a new column to a board
export async function createColumn(data: Column) {
  // Check if the user is logged in
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: 'You need to be logged in to create a column',
    };
  }

  const { name, boardId } = data;

  // Check if required fields are empty
  if (!name || name.length < 3) {
    return {
      success: false,
      error: 'Column name must be at least 3 characters',
    };
  }

  // Connect to MongoDB
  await connectDB();

  // Check if the board exists
  const board = await Board.findOne({
    userId: session.user.id,
  });

  if (!board) {
    return {
      success: false,
      error: 'Board not found',
    };
  }

  // Check if the column exists
  const column = await Column.findOne({
    name,
    boardId: board._id,
  });

  if (column) {
    return {
      success: false,
      error: 'Column already exists',
    };
  }

  const newColumn = await Column.create({
    name,
    boardId: board._id,
    order: board.columns.length,
  });

  const addToBoard = await Board.findByIdAndUpdate(board._id, {
    $push: { columns: newColumn._id },
  });

  revalidatePath('/dashboard');

  return {
    success: true,
    data: formatData(newColumn),
    message: 'Column created successfully',
  };
}

// Delete a column
export async function deleteColumn(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const column = await Column.findOne({ _id: id });

  if (!column) {
    return { success: false, error: 'Column not found' };
  }

  // Check if board belongs to user logged in
  const board = await Board.findOne({
    _id: column.boardId,
    userId: session.user.id,
  });

  if (!board) {
    return { success: false, error: 'Board not found' };
  }

  if (board.userId !== session.user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  await Board.findByIdAndUpdate(column.boardId, {
    $pull: { columns: id },
  });

  await JobApplication.deleteMany({ columnId: id });

  await Column.deleteOne({ _id: id });
  revalidatePath('/dashboard');

  return { success: true, message: 'Column deleted successfully' };
}
