import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  const nodeWidth = 150;
  const nodeHeight = 40;

  // Only create input handles if numInputs > 0
  const inputHandles = data.numInputs > 0 ? Array.from({ length: data.numInputs }, (_, i) => (
    <Handle
      key={`input-${i}`}
      type="target"
      position={Position.Left}
      id={`in-${i}`}
      style={{
        top: `${(i + 1) * (100 / (data.numInputs + 1))}%`,
        left: 0
      }}
    />
  )) : null;

  // Only create output handles if numOutputs > 0
  const outputHandles = data.numOutputs > 0 ? Array.from({ length: data.numOutputs }, (_, i) => (
    <Handle
      key={`output-${i}`}
      type="source"
      position={Position.Right}
      id={`out-${i}`}
      style={{
        top: `${(i + 1) * (100 / (data.numOutputs + 1))}%`,
        right: 0
      }}
    />
  )) : null;

  // Add flow control handles if needed
  const flowHandles = data.isFlowControl ? (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="flow-in"
        style={{ 
          top: 0,
          background: 'purple'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="flow-out"
        style={{ 
          bottom: 0,
          background: 'purple'
        }}
      />
    </>
  ) : null;

  return (
    <div 
      className="custom-node"
      style={{
        width: nodeWidth,
        height: nodeHeight,
        border: `2px solid ${data.color || 'gray'}`,
        borderRadius: '4px',
        position: 'relative',
        background: 'white',
        padding: '10px'
      }}
    >
      {inputHandles}
      {outputHandles}
      {flowHandles}
      <div style={{ textAlign: 'center' }}>
        <strong>{data.label || 'Node'}</strong>
        <br />
        <small>{data.nodeType || 'Default'}</small>
      </div>
    </div>
  );
};

export default CustomNode;
