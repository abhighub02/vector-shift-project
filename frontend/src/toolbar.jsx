import { toolbarGroups, resolveAccent } from './nodes/registry';

/*
 * A draggable palette entry. Carries only the node *type* through the drag; the
 * canvas rebuilds the node from the registry on drop, so this never has to know
 * a node's fields or defaults.
 */
const DraggableNode = ({ definition }) => {
  const Icon = definition.icon;

  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', definition.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="node-chip"
      style={{ '--chip-accent': `var(--hue-${resolveAccent(definition)})` }}
      draggable
      onDragStart={onDragStart}
      title={`Drag to add a ${definition.label} node`}
    >
      {Icon && (
        <span className="node-chip-icon">
          <Icon size={14} />
        </span>
      )}
      {definition.label}
    </div>
  );
};

/*
 * The palette is derived from the registry rather than hand-written, so
 * registering a node definition is all it takes to make it appear here — with
 * the right label, icon, accent and group.
 */
export const PipelineToolbar = () => (
  <div className="toolbar">
    {Object.entries(toolbarGroups).map(([group, definitions], index) => (
      <div className="toolbar-group" key={group}>
        {index > 0 && <div className="toolbar-divider" />}
        <span className="toolbar-group-label">{group}</span>
        {definitions.map((definition) => (
          <DraggableNode key={definition.type} definition={definition} />
        ))}
      </div>
    ))}
  </div>
);
