import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  // Provide default dimensions
  const nodeWidth = 150;
  const nodeHeight = 40;

  return (
    <div 
      className="custom-node"
      style={{
        width: nodeWidth,
        height: nodeHeight,
        position: 'relative'
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ top: 0 }}
      />
      <div>
        <strong>{data.label || 'Node'}</strong>
        <br />
        <small>{data.nodeType || 'Default'}</small>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ bottom: 0 }}
      />
    </div>
  );
};

export default CustomNode;
