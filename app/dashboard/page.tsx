import { getSession } from '@/lib/auth/auth';
import connectDB from '@/lib/db';
import { Board } from '@/lib/models';
import KanbanBoard from '@/components/shared/kaban-board';
import { formatData } from '@/lib/helpers/format-data';
import { Suspense } from 'react';
import CreateCollumnDialog from '@/components/fragments/create-column-dialog';

async function getBoard(userId: string) {
  'use cache';

  await connectDB();

  const boardRaw = await Board.findOne({
    userId,
    name: 'My Board',
  }).populate({
    path: 'columns',
    populate: {
      path: 'jobApplications',
    },
  });

  if (!boardRaw) return null;

  return formatData(boardRaw);
}

async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    return <div>You need to be logged in to access this page</div>;
  }

  const board = await getBoard(session?.user?.id);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Job Hunt</h1>
            <p className="text-gray-600">Track your job applications</p>
          </div>
          <div>
            <CreateCollumnDialog boardId={board?._id as string} />
          </div>
        </div>
        <KanbanBoard board={board} userId={session?.user?.id} />
      </div>
    </div>
  );
}

const Dashboard = async () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardPage />
    </Suspense>
  );
};

export default Dashboard;
