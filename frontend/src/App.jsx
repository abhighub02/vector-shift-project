import { useShallow } from 'zustand/react/shallow';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { useStore } from './store';
import { BrandIcon } from './lib/icons';

const Header = () => {
  const { nodeCount, edgeCount } = useStore(
    useShallow((state) => ({ nodeCount: state.nodes.length, edgeCount: state.edges.length }))
  );

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">
          <BrandIcon size={16} />
        </span>
        VectorShift
      </div>
      <div className="brand-divider" />
      <span className="brand-subtitle">Pipeline Builder</span>

      <div className="header-spacer" />

      <div className="header-stats">
        <span className="header-stat">
          <strong>{nodeCount}</strong> nodes
        </span>
        <span className="header-stat">
          <strong>{edgeCount}</strong> edges
        </span>
      </div>
    </header>
  );
};

export default function App() {
  return (
    <div className="app">
      <Header />
      <PipelineToolbar />
      <PipelineUI />
      <SubmitButton />
    </div>
  );
}
