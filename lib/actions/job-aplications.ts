'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '../auth/auth';
import connectDB from '../db';
import { Board, Column, JobApplication } from '../models';
import { formatData } from '../helpers/format-data';

interface JobApplication {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  columnId: string;
  boardId: string;
  tags?: string[];
  description?: string;
}

export async function createJobApplication(data: JobApplication) {
  // Check if the user is logged in
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: 'You need to be logged in to create a job application',
    };
  }

  const {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description,
  } = data;

  // Check if required fields are empty
  if (!company || !position || !boardId || !columnId) {
    return {
      success: false,
      error: 'Missing required fields',
    };
  }

  // Connect to MongoDB
  await connectDB();

  // Check if the board exists and belongs to user logged in
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  });

  if (!board) {
    return {
      success: false,
      error: 'Board not found',
    };
  }

  // Check if the column exists and belongs to board
  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId,
  });

  if (!column) {
    return {
      success: false,
      error: 'Column not found',
    };
  }

  // Find the last job application order to add next one
  const maxOrder = (await JobApplication.findOne({ columnId })
    .sort({ order: -1 })
    .select('order')
    .lean()) as { order: number } | null;

  const jobApplication = await JobApplication.create({
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    userId: session.user.id,
    tags: tags || [],
    description,
    status: 'applied',
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  });

  revalidatePath('/dashboard');

  return {
    success: true,
    data: formatData(jobApplication),
    message: 'Job application created successfully',
  };
}

export async function updateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  },
) {
  // Check if the user is logged in
  const session = await getSession();

  if (!session?.user) {
    return {
      success: false,
      error: 'You need to be logged in to update a job application',
    };
  }

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return {
      success: false,
      error: 'Job application not found',
    };
  }

  if (jobApplication.userId !== session.user.id) {
    return {
      success: false,
      error: 'You are not authorized to update this job application',
    };
  }

  const { columnId, order, ...otherUpdates } = updates;

  const updatesToApply: Partial<{
    company: string;
    position: string;
    location: string;
    notes: string;
    salary: string;
    jobUrl: string;
    columnId: string;
    order: number;
    tags: string[];
    description: string;
  }> = otherUpdates;

  const currentColumnId = jobApplication.columnId.toString();
  const newColumnId = columnId?.toString();

  const isMovingToDifferentColumn =
    newColumnId && newColumnId !== currentColumnId;

  if (isMovingToDifferentColumn) {
    // Remove the job application from the current column
    await Column.findByIdAndUpdate(currentColumnId, {
      $pull: { jobApplications: id },
    });

    const jobsInTargetColumn = await JobApplication.find({
      columnId: newColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    let newOrderValue: number;

    if (order !== undefined && order !== null) {
      newOrderValue = order * 100;

      const jobsThatNeedToBeMoved = jobsInTargetColumn.slice(order);
      for (const job of jobsThatNeedToBeMoved) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: {
            order: job.order + 100,
          },
        });
      }
    } else {
      if (jobsInTargetColumn.length > 0) {
        const lastJobOrder =
          jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
        newOrderValue = lastJobOrder + 100;
      } else {
        newOrderValue = 0;
      }
    }

    updatesToApply.columnId = newColumnId;
    updatesToApply.order = newOrderValue;

    await Column.findByIdAndUpdate(newColumnId, {
      $push: { jobApplications: id },
    });
  } else if (order !== undefined && order !== null) {
    const otherJobsInColumn = await JobApplication.find({
      columnId: currentColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    const currentJobOrder = jobApplication.order || 0;
    const currentPositionIndex = otherJobsInColumn.findIndex(
      (job) => job.order > currentJobOrder,
    );
    const oldPositionindex =
      currentPositionIndex === -1
        ? otherJobsInColumn.length
        : currentPositionIndex;

    const newOrderValue = order * 100;

    if (order < oldPositionindex) {
      const jobsToShiftDown = otherJobsInColumn.slice(order, oldPositionindex);

      for (const job of jobsToShiftDown) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else if (order > oldPositionindex) {
      const jobsToShiftUp = otherJobsInColumn.slice(oldPositionindex, order);
      for (const job of jobsToShiftUp) {
        const newOrder = Math.max(0, job.order - 100);
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: newOrder },
        });
      }
    }

    updatesToApply.order = newOrderValue;
  }

  const updated = await JobApplication.findByIdAndUpdate(id, updatesToApply, {
    new: true,
  });

  revalidatePath('/dashboard');

  return {
    success: true,
    data: formatData(updated),
    message: 'Job application updated successfully',
  };
}

export async function deleteJobApplication(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { success: false, error: 'Job application not found' };
  }

  if (jobApplication.userId !== session.user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  await Column.findByIdAndUpdate(jobApplication.columnId, {
    $pull: { jobApplications: id },
  });

  await JobApplication.deleteOne({ _id: id });
  revalidatePath('/dashboard');

  return { success: true, message: 'Job application deleted successfully' };
}
