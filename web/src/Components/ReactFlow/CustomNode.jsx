import { Handle, Position } from 'reactflow';
import StatusLight from '../StatusLight';
import NodeConfig from '../CustomNode/NodeConfig';
import { useState } from 'react';

const CustomNode = ({ data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const nodeWidth = 150;
  const nodeHeight = 40;

  const toggleConfig = () => {
    setShowConfig(!showConfig);
  };

  const handleSubmit = (optionsData, flowData) => {
    if (data.onConfigSubmit) {
      data.onConfigSubmit(data.id, optionsData, flowData);
    }
    toggleConfig();
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(data.id);
    }
    toggleConfig();
  };

  // Create a nodeData object that matches the structure expected by NodeConfig
  const nodeData = {
    options: {
      id: data.id,
      name: data.label,
      color: data.color,
      status: data.status,
      option_replace: data.flowData,
      ...data.options
    },
    config: data.config || {},
    configParams: data.configParams || {},
    flow_variables: data.flowVariables || []
  };

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
    <div className="custom-node-wrapper">
      <div className="custom-node-name">{data.label}</div>
      <div 
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
        <div className="custom-node-icons">
          <div 
            className="custom-node-configure" 
            onClick={(e) => {
              e.stopPropagation();
              toggleConfig();
            }}
          >
            {String.fromCharCode(9881)}
          </div>
        </div>
      </div>
      <StatusLight status={data.status || 'unconfigured'} />
      <div className="custom-node-description">{data.description}</div>

      <NodeConfig
        node={nodeData}
        show={showConfig}
        toggleShow={toggleConfig}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CustomNode;
