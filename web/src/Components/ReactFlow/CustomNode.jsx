import { Handle, Position } from 'reactflow';
import StatusLight from '../StatusLight';
import NodeConfig from '../CustomNode/NodeConfig';
import GraphView from '../CustomNode/GraphView';
import React from 'react';
import '../../styles/ReactFlowCustomNode.css';
import * as API from '../../API';

export default class CustomNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showConfig: false,
      showGraph: false
    };
    
    this.toggleConfig = this.toggleConfig.bind(this);
    this.toggleGraph = this.toggleGraph.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  toggleConfig() {
    this.setState({ showConfig: !this.state.showConfig });
  }

  toggleGraph() {
    this.setState({ showGraph: !this.state.showGraph });
  }

  handleSubmit(optionsData, flowData) {
    const { data: node } = this.props;
    API.updateNode(node, optionsData, flowData).then(() => {
      node.setStatus("configured");
    }).catch(err => console.log(err));
  }

  handleDelete() {
    const { data: node } = this.props;
    if (node.remove) {
      node.remove();
    }
  }

  render() {
    const { data: node } = this.props;
    const nodeWidth = node.options.node_type === "flow_control" ? 40 : 80;
    const nodeHeight = 40;

    return (
      <div className="custom-node-wrapper">
        <div className="custom-node-name">{node.options.name}</div>
        <div 
          className="custom-node"
          style={{
            width: nodeWidth,
            height: nodeHeight,
            border: `2px solid ${node.options.color || 'gray'}`,
            borderRadius: '4px',
            position: 'relative',
            background: 'white',
            padding: '10px'
          }}
        >
          {/* Flow control input handle */}
          <Handle
            type="target"
            position={Position.Left}
            id="flow-in"
            style={{ 
              top: 0,
              left: 0,
              transform: 'translate(-50%, -50%)',
              background: 'purple',
              width: '10px',
              height: '10px',
              borderRadius: '50%'
            }}
          />

          {/* Flow control output handle - only for flow control nodes */}
          {node.options.node_type === "flow_control" && (
            <Handle
              type="source"
              position={Position.Right}
              id="flow-out"
              style={{ 
                top: 0,
                right: 0,
                transform: 'translate(50%, -50%)',
                background: 'purple',
                width: '10px',
                height: '10px',
                borderRadius: '50%'
              }}
            />
          )}

          <div className="custom-node-icons">
            <div 
              className="custom-node-configure" 
              onClick={(e) => {
                e.stopPropagation();
                this.toggleConfig();
              }}
            >
              {String.fromCharCode(9881)}
            </div>
            {node.options.node_type !== "flow_control" && (
              <div 
                className="custom-node-tabular"
                onClick={(e) => {
                  e.stopPropagation();
                  this.toggleGraph();
                }}
              >
                <img src="/json-icon.png" alt="Tabular" style={{width: 25, height: 25}}/>
              </div>
            )}
          </div>

          {/* Regular input/output handles */}
          {Array.from({ length: node.options.num_in || 0 }).map((_, i) => (
            <Handle
              key={`input-${i}`}
              type="target"
              position={Position.Left}
              id={`in-${i}`}
              style={{ top: `${(i + 1) * (100 / ((node.options.num_in || 0) + 1))}%` }}
            />
          ))}
          {Array.from({ length: node.options.num_out || 0 }).map((_, i) => (
            <Handle
              key={`output-${i}`}
              type="source"
              position={Position.Right}
              id={`out-${i}`}
              style={{ top: `${(i + 1) * (100 / ((node.options.num_out || 0) + 1))}%` }}
            />
          ))}
        </div>
        <StatusLight status={node.options.status} />
        <div className="custom-node-description">{node.config.description}</div>

        <NodeConfig
          node={node}
          show={this.state.showConfig}
          toggleShow={this.toggleConfig}
          onDelete={this.handleDelete}
          onSubmit={this.handleSubmit}
        />

        <GraphView
          node={node}
          show={this.state.showGraph}
          toggleShow={this.toggleGraph}
        />
      </div>
    );
  }
}
