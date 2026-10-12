import { useParams } from 'react-router-dom';

export const AdminPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Manage Poll</h1>
      <p className="text-sm text-slate-400">Poll ID: {id}</p>
    </div>
  );
};
