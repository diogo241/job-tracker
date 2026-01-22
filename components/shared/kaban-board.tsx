'use client';

import {
  Board,
  type Column,
  type JobApplication,
} from '@/lib/models/models.types';
import { Award, Calendar, CheckCircle2, Mic, XCircle } from 'lucide-react';
import DroppableColumn from '../fragments/droppable-column';
import { useBoard } from '@/lib/hooks/use-boards';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import JobApplicationCard from '../fragments/job-application-card';

interface KanbanBoardProps {
  board: Board | null;
  userId: string;
}

interface ColConfig {
  color: string;
  icon: React.ReactNode;
}

const COLUMN_CONFIG: Array<ColConfig> = [
  {
    color: 'bg-cyan-500',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    color: 'bg-purple-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    color: 'bg-green-500',
    icon: <Mic className="h-4 w-4" />,
  },
  {
    color: 'bg-yellow-500',
    icon: <Award className="h-4 w-4" />,
  },
  {
    color: 'bg-red-500',
    icon: <XCircle className="h-4 w-4" />,
  },
];

const KabanBoard = ({ board, userId }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { columns, moveJob } = useBoard(board);

  const sortedColumns = columns?.sort((a, b) => a.order - b.order) || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  async function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if (active.id !== activeId) {
      setActiveId(active.id as string);
    }
  }
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveId(null);

    if (!over || !board?._id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let draggedJob: JobApplication | null = null;
    let sourceColumn: Column | null = null;
    let sourceIndex = -1;

    for (const column of sortedColumns) {
      const jobs =
        column.jobApplications.sort((a, b) => a.order - b.order) || [];
      const jobIndex = jobs.findIndex((job) => job._id === activeId);
      if (jobIndex !== -1) {
        draggedJob = jobs[jobIndex];
        sourceColumn = column;
        sourceIndex = jobIndex;
        break;
      }
    }

    if (!draggedJob || !sourceColumn) return;

    // Check if dropped in a column or another job
    const targetColumn = sortedColumns.find((col) => col._id === overId);
    const targetJob = sortedColumns
      .flatMap((col) => col.jobApplications || [])
      .find((job) => job._id === overId);

    let targetColumnId: string;
    let newOrder: number;

    if (targetColumn) {
      targetColumnId = targetColumn._id;
      const jobsInTarget =
        targetColumn.jobApplications
          .filter((job) => job._id !== activeId)
          .sort((a, b) => a.order - b.order) || [];
      newOrder = jobsInTarget.length;
    } else if (targetJob) {
      const targetJobColumn = sortedColumns.find((col) =>
        col.jobApplications.some((job) => job._id === targetJob._id),
      );

      targetColumnId = targetJobColumn?._id || targetJob.columnId || '';
      if (!targetColumnId) return;

      const targetColumnObj = sortedColumns.find(
        (col) => col._id === targetColumnId,
      );
      if (!targetColumnObj) return;

      const allJobsInTargetOriginal =
        targetColumnObj.jobApplications.sort((a, b) => a.order - b.order) || [];

      const allJobsInTargetFiltered = allJobsInTargetOriginal.filter(
        (job) => job._id !== activeId,
      );

      const targetIndexInOriginal = allJobsInTargetOriginal.findIndex(
        (job) => job._id === overId,
      );

      const targetIndexInFiltered = allJobsInTargetFiltered.findIndex(
        (job) => job._id === overId,
      );

      if (targetIndexInOriginal !== -1) {
        if (sourceColumn._id === targetColumnId) {
          if (sourceIndex < targetIndexInOriginal) {
            newOrder = targetIndexInOriginal + 1;
          } else {
            newOrder = targetIndexInOriginal;
          }
        } else {
          newOrder = targetIndexInFiltered;
        }
      } else {
        newOrder = allJobsInTargetFiltered.length;
      }
    } else {
      return;
    }

    if (!targetColumnId) return;

    await moveJob(activeId, targetColumnId, newOrder);
  }

  const activeJob = sortedColumns
    .flatMap((col) => col.jobApplications || [])
    .find((job) => job._id === activeId);

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-x-4">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedColumns?.map((col, key) => {
            const config = COLUMN_CONFIG[key] || COLUMN_CONFIG[0];
            return (
              <DroppableColumn
                key={key}
                column={col}
                config={config}
                boardId={board!._id}
                sortedColumns={sortedColumns}
              />
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeJob ? <div className="opacity-50">
          <JobApplicationCard job={activeJob} columns={sortedColumns} />
        </div> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KabanBoard;
