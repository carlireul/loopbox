import {
  createNewProject,
  deleteProject,
  useProjectList,
} from '../data/projects';

/** Landing screen: open an existing project or create a new one. */
export function ProjectPicker({ onOpen }: { onOpen: (id: string) => void }) {
  const projects = useProjectList();
  if (!projects) return null;

  const create = async () => {
    const id = await createNewProject(
      `Untitled Project ${projects.length + 1}`,
    );
    onOpen(id);
  };

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-2xl font-bold text-sky-700">loopbox</h1>
      <ul className="flex flex-col gap-2">
        {projects.map((project) => (
          <li
            key={project.id}
            className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
          >
            <button
              className="font-semibold text-sky-700 hover:underline"
              onClick={() => onOpen(project.id)}
            >
              {project.name}
            </button>
            <button
              className="track-button"
              aria-label={`Delete ${project.name}`}
              onClick={() => deleteProject(project.id)}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-brand mt-4" onClick={create}>
        <i className="fa-solid fa-plus" /> New Project
      </button>
    </div>
  );
}
