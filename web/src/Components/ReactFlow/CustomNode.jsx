import { Handle, Position } from 'reactflow';
import StatusLight from '../StatusLight';
import NodeConfig from '../CustomNode/NodeConfig';
import GraphView from '../CustomNode/GraphView';
import { useState } from 'react';
import '../../styles/ReactFlowCustomNode.css';

const CustomNode = ({ data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const nodeWidth = 150;
  const nodeHeight = 40;

  const toggleConfig = () => {
    setShowConfig(!showConfig);
  };

  const toggleGraph = () => {
    setShowGraph(!showGraph);
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

  // Create a nodeData object that matches the structure expected by NodeConfig/GraphView
  const nodeData = {
    options: {
      id: data.id,
      name: data.label,
      color: data.color,
      status: data.status,
      option_replace: data.flowData,
      node_type: data.options?.node_type,
      ...data.options
    },
    config: data.config || {},
    configParams: data.configParams || {},
    flow_variables: data.flowVariables || [],
    getNodeId: () => data.id,
    serialize: () => ({
      id: data.id,
      ...data.options
    })
  };

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
        {/* Input/Output handles */}
        {Array.from({ length: data.numInputs }).map((_, i) => (
          <Handle
            key={`input-${i}`}
            type="target"
            position={Position.Left}
            style={{ top: `${(i + 1) * (100 / (data.numInputs + 1))}%` }}
          />
        ))}
        {Array.from({ length: data.numOutputs }).map((_, i) => (
          <Handle
            key={`output-${i}`}
            type="source"
            position={Position.Right}
            style={{ top: `${(i + 1) * (100 / (data.numOutputs + 1))}%` }}
          />
        ))}

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
          {nodeData.options.node_type !== "flow_control" && (
            <div 
              className="custom-node-tabular"
              onClick={(e) => {
                e.stopPropagation();
                toggleGraph();
              }}
            >
              <img src="/json-icon.png" alt="Tabular" style={{width: 25, height: 25}}/>
            </div>
          )}
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

      <GraphView
        node={nodeData}
        show={showGraph}
        toggleShow={toggleGraph}
      />
    </div>
  );
};

export default CustomNode;
