import { useState } from 'react';
import { ProjectPicker } from './ProjectPicker';
import { Daw } from './Daw';

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);

  return projectId ? (
    <Daw projectId={projectId} onExit={() => setProjectId(null)} />
  ) : (
    <ProjectPicker onOpen={setProjectId} />
  );
}
