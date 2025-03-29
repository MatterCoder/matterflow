import { 
  CloseCircleFilled, 
  SaveOutlined, 
  ExportOutlined, 
  UploadOutlined, 
  ClearOutlined, 
  PlayCircleOutlined, 
  PlaySquareFilled, 
  StopOutlined 
} from "@ant-design/icons";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import { Button as AntdButton, Modal as AntdModal, notification, Checkbox as AntdCheckbox } from "antd";
import { useEffect, useRef, useState, useCallback } from "react";
import { Col, Row } from "react-bootstrap";
import * as API from "../API";
import "../styles/Workspace.css";
import CustomNodeFactory from "./CustomNode/CustomNodeFactory";
import CustomNodeModel from "./CustomNode/CustomNodeModel";
import FlowMenu from "./FlowMenu";
import GlobalFlowMenu from "./GlobalFlowMenu";
import MFLinkFactory from "./MFLink/MFLinkFactory";
import MFPortFactory from "./MFPort/MFPortFactory";
import ModelMenu from "./ModelMenu";
import NodeMenu from "./NodeMenu";
import BannerBox from "./BannerBox";
import WatermarkText from "./WatermarkText";
import ReactFlow, { 
  Controls, 
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import CustomNode from './ReactFlow/CustomNode';
import 'reactflow/dist/style.css';

const { confirm } = AntdModal;

const nodeTypes = {
  customNode: CustomNode
};

/**
 * Workspace Component: Manages the diagram workspace and handles node operations.
 */
const Workspace = (props) => {
  const [nodes, setNodes] = useState([]);
  const [flows] = useState([]);
  const [models, setModels] = useState([]);
  const [globals, setGlobals] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [processId, setProcessId] = useState();
  const [processes, setProcesses] = useState([]);

  // Set up the react-diagrams engine
  const engine = useRef(createEngine()).current;
  const model = useRef(new DiagramModel()).current;

  const diagramData = useRef(null);

  engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  engine.getLinkFactories().registerFactory(new MFLinkFactory());
  engine.getPortFactories().registerFactory(new MFPortFactory());
  engine.setModel(model);
  engine.setMaxNumberPointsPerLink(0);

  // Register listeners for links here
  model.registerListener({
    linksUpdated:(e) => {
      e.link.registerListener({
        targetPortChanged:(event) => {
          //this is to fix a bug where the edge is not created by the MFLinkModel
          event.stopPropagation()
          API.addEdge(event.entity).catch(() => {});
        },
        entityRemoved:(event) => {
          //this is to fix a bug where the edge is not deleted by the MFLinkModel
          event.stopPropagation()
          API.deleteEdge(event.entity).catch(() => {});
        },
      })
    }
  });

  //we can access the flow_id by using props.params.flow_id
  const flow_id = props.params?.flow_id;

  const [showNodeMenu, setShowNodeMenu] = useState(true);
  const [api, contextHolder] = notification.useNotification();

  // Add new state for ReactFlow
  const [flowNodes, setFlowNodes] = useState([]);
  const [flowEdges, setFlowEdges] = useState([]);

  // Add ReactFlow required handlers
  const onNodesChange = useCallback((changes) => {
    setFlowNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange = useCallback(
    (changes) => setFlowEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeDragStop = useCallback((event, node) => {
    // Update ReactFlow state
    setFlowNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position
          };
        }
        return n;
      })
    );
  }, []);

  // Convert Storm nodes to ReactFlow format - only called when a new node is added
  const convertStormNodesToFlow = useCallback(() => {
    const stormNodes = model.getNodes();
    const stormLinks = model.getLinks();

    const flowNodes = stormNodes.map(node => {
      const position = node.getPosition();
      const nodeOptions = node.getOptions();
      const nodeConfig = node.getConfig ? node.getConfig() : {};
      
      return {
        id: nodeOptions.id,
        position: {
          x: position.x || 0,
          y: position.y || 0
        },
        type: 'customNode',
        draggable: true,
        data: {
          id: nodeOptions.id,
          label: nodeOptions.name,
          color: nodeOptions.color,
          status: nodeOptions.status,
          description: nodeOptions.description,
          numInputs: nodeOptions.num_in === undefined ? 0 : parseInt(nodeOptions.num_in),
          numOutputs: nodeOptions.num_out === undefined ? 0 : parseInt(nodeOptions.num_out),
          isFlowControl: nodeOptions.node_type === "flow_control",
          options: nodeOptions,
          config: nodeConfig,
          configParams: node.configParams || {},
          flowVariables: node.flow_variables || [],
          flowData: nodeOptions.option_replace || {},
          onConfigSubmit: (nodeId, optionsData, flowData) => {
            const stormNode = stormNodes.find(n => n.getOptions().id === nodeId);
            if (stormNode) {
              API.updateNode(stormNode, optionsData, flowData)
                .then(() => {
                  stormNode.setStatus("configured");
                  setFlowNodes([...flowNodes]); // Trigger re-render
                })
                .catch(err => console.log(err));
            }
          },
          onDelete: (nodeId) => {
            const stormNode = stormNodes.find(n => n.getOptions().id === nodeId);
            if (stormNode) {
              API.deleteNode(stormNode)
                .then(() => {
                  // Remove from Storm diagram
                  stormNode.remove();
                  engine.repaintCanvas();
                  
                  // Remove from ReactFlow
                  const updatedNodes = flowNodes.filter(n => n.id !== nodeId);
                  setFlowNodes(updatedNodes);
                })
                .catch(err => console.log(err));
            }
          }
        }
      };
    });
    
    const flowEdges = stormLinks.map(link => ({
      id: link.getOptions().id,
      source: link.getSourcePort().getNode().getOptions().id,
      target: link.getTargetPort().getNode().getOptions().id,
      type: 'default'
    }));

    setFlowNodes(flowNodes);
    setFlowEdges(flowEdges);
  }, [model]);

  // Update ReactFlow when Storm diagram changes
  useEffect(() => {
    // Listen to model changes
    const listener = {
      nodesUpdated: () => {
        convertStormNodesToFlow();
      },
      linksUpdated: () => {
        convertStormNodesToFlow();
      }
    };

    model.registerListener(listener);
    
    // Initial conversion
    convertStormNodesToFlow();

    return () => {
      model.deregisterListener(listener);
    };
  }, [model, convertStormNodesToFlow]);

  // Constant for poll interval (in milliseconds)
  const PROCESS_POLL_TIME = 10000; // 10 seconds (converted to ms)
  const [pollInterval,setPollInterval] = useState(PROCESS_POLL_TIME);

  const pollProcesses = useCallback(async () => {
    try {
      const response = await API.getProcesses();
      setProcesses(JSON.parse(response.data));
    } catch (error) {
      console.error(error);
    }
  }, []); // No dependencies needed unless `API.getProcesses` or `setProcesses` change

  useEffect(() => {
    // Run the function once immediately.
    pollProcesses();

    // Set up the interval.
    const intervalId = setInterval(pollProcesses, pollInterval);

    // Clean up the interval when the component unmounts or when the effect re-runs.
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollProcesses, pollInterval]); // Only include `pollProcesses` and not `pollInterval`.
  
  const showBannerMessage = useCallback(() => {

    // Get screen width
    const screenWidth = window.innerWidth;

    // Determine banner width dynamically based on screen width
    let bannerWidth;
    if (screenWidth > 1200) {
      bannerWidth = 900; // For larger screens
    } else if (screenWidth > 768) {
      bannerWidth = 600; // For medium screens like tablets
    } else {
      bannerWidth = 300; // For smaller screens like mobile
    }

    api.open({
      style : { width: bannerWidth },
      message: "",   
      description:(
        <BannerBox/>
      ),
      duration: 0, //0 means indefinite, pass a +ve number to hide it after that time
      placement: "topRight",
      onClick: (e) => {
        //Perform any action on click on message
        console.log("Banner Message Click");
        console.log(e);
      },
      onClose: () => {
        //Perform whatever action wanted after message is closed
        console.log("Banner Message Closed");
      },
    });
  }, [api]);

  useEffect(() => {
    if (flow_id && flow_id != "new") {
      API.getFlow(flow_id)
        .then((value) => {
          try {
            diagramData.current = JSON.parse(value.data.json_data)["react"];
            setProcessId(diagramData.current.id)
          } catch {
            console.log("Invalid or missing json data");
            diagramData.current = {};
            window.location = `/`;
          }

          if (Object.keys(diagramData.current).length === 0) {
            API.initWorkflow(model)
              .then(() => {
                getAvailableNodes();
                getGlobalVars();
              })
              .catch((err) => console.log(err));
          } else {
            //activate on the server
            API.activateWorkflow(value).then(() => {
              model.deserializeModel(diagramData.current, engine);
              setTimeout(() => engine.repaintCanvas(), 100);
              getGlobalVars();
              getAvailableNodes();
            });
          }
        })
        .catch(() => (window.location = `/`));
    } else {
      API.initWorkflow(model)
        .then(() => {
          getAvailableNodes();
          getGlobalVars();
        })
        .catch((err) => console.log(err));

      if (flow_id != "new") {
        //Open Banner Message
        showBannerMessage();
      }
    }
  }, [flow_id, engine, model, showBannerMessage]);

  /**
   * Retrieve available nodes from server to display in the menu
   */
  const getAvailableNodes = () => {
    API.getNodes()
      .then((nodes) => setNodes(nodes))
      .catch((err) => console.log(err));
  };

  /**
   * Retrieve global variables from server
   */
  const getGlobalVars = () => {
    API.getGlobalVars()
      .then((vars) => setGlobals(vars))
      .catch((err) => console.log(err));
  };

  /**
   * Retrieve available models from server to display in the menu
   */
  const getAvailableModels = () => {
    API.getModels()
      .then((models) => setModels(models))
      .catch((err) => console.log(err));
  };

  /**
   * Load diagram JSON and render
   * @param {Object} diagramData - Serialized diagram JSON
   */
  const load = (diagramData) => {
    model.deserializeModel(diagramData, engine);

    setTimeout(() => engine.repaintCanvas(), 100);
    getGlobalVars();
  };

  /**
   * Remove all nodes from diagram and initialize a new workflow on the server
   */
  const clear = () => {
    confirm({
      title: "Clear diagram? You will lose all work.",
      okButtonProps: {
        danger: true,
      },
      onOk() {
        model.getNodes().forEach((n) => n.remove());
        API.initWorkflow(model)
          .then(() => getGlobalVars())
          .catch((err) => console.log(err));
        engine.repaintCanvas();
      },
    });
  };

  // Modified handleNodeCreation to be canvas-agnostic
  const createNode = (point, data) => {
    // Ensure valid coordinates
    const validPoint = {
      x: point.x || 0,
      y: point.y || 0
    };

    const node = new CustomNodeModel(data.nodeInfo, data.config);
    node.setPosition(validPoint.x, validPoint.y);
    
    API.addNode(node)
      .then(() => {
        model.addNode(node);
        engine.repaintCanvas();
        convertStormNodesToFlow(); // This will handle the ReactFlow update
        setIsDirty(true);
      })
      .catch((err) => console.log(err));
  };

  // Handler for Storm diagram drops
  const handleStormDrop = (event) => {
    const evtData = event.dataTransfer.getData("storm-diagram-node");
    if (!evtData) return;
    
    const data = JSON.parse(evtData);
    const point = engine.getRelativeMousePoint(event);
    createNode(point, data);
  };

  // Handler for ReactFlow drops
  const handleReactFlowDrop = (event) => {
    event.preventDefault();
    const evtData = event.dataTransfer.getData("storm-diagram-node");
    if (!evtData) return;
    
    const data = JSON.parse(evtData);
    
    // Get the ReactFlow wrapper element
    const reactFlowWrapper = document.querySelector('.react-flow-wrapper');
    const bounds = reactFlowWrapper.getBoundingClientRect();

    // Calculate the relative position in ReactFlow and ensure valid numbers
    const point = {
      x: Math.max(0, event.clientX - bounds.left),
      y: Math.max(0, event.clientY - bounds.top)
    };

    createNode(point, data);
  };

  // Common drag over handler
  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handle saving the diagram data
   * @param {string} flow_id - The flow ID
   */
  const handleSave = (flow_id) => {
    //save the flow file to server so we can start the supervisor process
    API.saveToServer(model.serialize()).then((value) => {
      const json_data = JSON.stringify(value);

      if (flow_id && flow_id != "new") {
        const inputData = {
          id: flow_id,
          json_data,
        };
        API.updateFlow(flow_id, inputData).then(() => {
          console.log("Flow saved successfully");
          setIsDirty(false);
        });
      } else {
        const inputData = {
          name: JSON.parse(json_data)["react"]["id"],
          description: "flow-" + Math.random().toString(36).substring(7),
          json_data,
        };
        // Logic to send the form data to the server
        API.addFlow(inputData).then((data) => {
          console.log("Flow created successfully");
          window.location = `/${data["Id"]}`;
        });
      }
    });
  };

  /**
   * Execute the workflow nodes in order
   */
  const execute = async () => {
    const order = await API.executionOrder();
    for (let i = 0; i < order.length; i++) {
      let node = model.getNode(order[i]);
      try {
        await API.execute(node);
        node.setStatus("complete");
        node.setSelected(true);
        node.setSelected(false);
        if (node.options.download_result) {
          await API.downloadDataFile(node);
        }
      } catch {
        console.log("Stopping execution because of failure");
        break;
      }
    }
  };

  const handleAddFlow = async () => {
    window.location = `/new`;
  };

  const flowProcesses = processes.filter((process) => process.name === processId);

  var processText = 'Flow not running as a process';
  if (flowProcesses.length > 0) {
    // Handle the "no match" scenario, such as showing a message or handling an error
    processText = `${processId} - ${flowProcesses[0]["statename"]}`;
  }

  return (
    <>
      {contextHolder}
      <Row className="Workspace">
        <Col xs={3}>
          <FlowMenu
            flow_id={flow_id}
            isDirty={isDirty}
            flows={flows}
            diagramModel={model}
            onNewFlow={handleAddFlow}
            processes={processes}
            setPollInterval={setPollInterval}
            pollInterval={pollInterval}
          />
          <ModelMenu models={models} onUpload={getAvailableModels} />
        </Col>
        <Col
          xs={showNodeMenu ? 7 : 9}
          style={{ paddingLeft: 0, marginTop: 24 }}
        >
          {/* Split the canvas area into two sections */}
          <div style={{ display: 'flex', height: '100vh' }}>
            {/* Original Storm Diagram */}
            <div
              style={{ 
                position: "relative", 
                flexGrow: 1, 
                width: '50%',
                borderRight: '1px solid #ccc' 
              }}
              onDrop={handleStormDrop}
              onDragOver={handleDragOver}
            >
              <div style={{ position: "relative", zIndex: 100, maxWidth: "80%" }}>
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                <AntdButton
                  size="sm"
                  type="primary"
                  icon={flowProcesses.length > 0 && flowProcesses[0]["statename"] === "RUNNING" ? <StopOutlined /> : <PlayCircleOutlined />}
                  onClick={() => {
                    if (flowProcesses.length > 0) {
                      if (flowProcesses[0]["statename"] === "RUNNING") {
                        API.stopProcess(processId)
                          .then(() => {
                            console.log("Stopped Process Successfully");
                            setPollInterval(pollInterval + 1); //lets change the polling interval to force a refetch
                          })
                          .catch((err) => console.log(err));
                      } else {
                        API.startProcess(processId)
                          .then(() => {
                            console.log("Started Process Successfully");
                            setPollInterval(pollInterval - 1); //lets change the polling interval to force a refetch
                          })
                          .catch((err) => console.log(err));
                      }
                    } else {
                      API.addProcess(processId)
                        .then(() => {
                          console.log("Added Process Successfully");
                          setPollInterval(pollInterval + 1); //lets change the polling interval to force a refetch
                        })
                        .catch((err) => console.log(err));
                    }
                  }}
                >
                  {flowProcesses.length > 0 && flowProcesses[0]["statename"] === "RUNNING" ? "Stop" : flowProcesses.length > 0 ? "Restart" : "Start"}
                </AntdButton>{" "}
                  <ExportButton model={model}/>{" "}
                  <FileUpload handleData={load} />{" "}
                  <AntdButton 
                    size="sm" 
                    onClick={clear}
                    type="primary"
                    icon=<ClearOutlined />  
                  >
                    Clear
                  </AntdButton>{" "}
                  <AntdButton 
                    size="sm" 
                    onClick={execute}
                    type="primary"
                    icon=<PlaySquareFilled />  
                  >
                    Test
                  </AntdButton>{" "}
                  <AntdButton 
                    size="sm" 
                    type="primary"
                    icon=<SaveOutlined />  
                    onClick={() => handleSave(flow_id)}
                    >
                    Save
                  </AntdButton>
                  <WatermarkText text={processText}/>
                </div>
              </div>
              <CanvasWidget className="diagram-canvas" engine={engine} />
            </div>

            {/* New ReactFlow Canvas */}
            <div 
              className="react-flow-wrapper"
              style={{ width: '50%', height: '100%' }}
              onDrop={handleReactFlowDrop}
              onDragOver={handleDragOver}
            >
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                nodesDraggable={true}
                nodesConnectable={false}
                defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
                minZoom={0.1}
                maxZoom={4}
                fitView={false} 
                fitViewOptions={{ padding: 0.2 }} 
              >
                {/* Add ReactFlow controls */}
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </div>
        </Col>
        {showNodeMenu && (
          <Col xs={2} style={{ marginTop: 24 }}>
            <NodeMenu nodes={nodes} onUpload={getAvailableNodes} />
            <GlobalFlowMenu
              menuItems={nodes["Flow Control"] || []}
              nodes={globals}
              onUpdate={getGlobalVars}
              diagramModel={model}
            />
          </Col>
        )}
      </Row>

      {showNodeMenu ? (
        <div style={{ position: "absolute", top: 24, right: 14 }}>
          <AntdButton
            type="text"
            size="sm"
            icon=<CloseCircleFilled />
            onClick={() => {
              setShowNodeMenu(false);
            }}
          ></AntdButton>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 32, right: 20 }}>
          <AntdButton
            type="default"
            size="sm"
            onClick={() => {
              setShowNodeMenu(true);
            }}
          >
            Open Node Menu
          </AntdButton>
        </div>
      )}
    </>
  );
};

// ExportButton Component
function ExportButton({ model }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [includeSensitiveData, setIncludeSensitiveData] = useState(false);

  const handleExport = () => {
      setIsModalVisible(true);  // Show modal on click
  };

  const handleOk = () => {
      setIsModalVisible(false);
      const serializedData = model.serialize();
      
      // Call the save function with processed data
      API.save(serializedData, true, !includeSensitiveData);
  };

  const handleCancel = () => {
      setIsModalVisible(false);
  };

  return (
      <>
          <AntdButton
              size="sm"
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExport}
          >
              Export
          </AntdButton>

          <AntdModal
              title="Export Flow File"
              visible={isModalVisible}
              onOk={handleOk}
              onCancel={handleCancel}
              okText="Continue"
              cancelText="Cancel"
          >
              <p>Warning: Your flow configuration file may contain sensitive environment variables, such as AWS keys and database credentials. We will attempt to automatically redact this information. Note: You may still need to review the file before sharing.</p>
              <AntdCheckbox
                  onChange={e => setIncludeSensitiveData(e.target.checked)}
                  checked={includeSensitiveData}
              >
                  Do not redact sensitive information
              </AntdCheckbox>
          </AntdModal>
      </>
  );
}

/**
 * FileUpload Component: Handles file upload and passes data to parent component.
 */
function FileUpload(props) {
  const input = useRef(null);

  /**
   * Upload the selected file
   * @param {File} file - The file to upload
   */
  const uploadFile = (file) => {
    const form = new FormData();
    form.append("file", file);
    API.uploadWorkflow(form)
      .then((json) => {
        props.handleData(json);
      })
      .catch((err) => console.log(err));
    input.current.value = null;
  };

  /**
   * Handle file selection
   * @param {Object} e - The event object from file input
   */
  const onFileSelect = (e) => {
    e.preventDefault();
    if (!input.current.files) return;
    uploadFile(input.current.files[0]);
  };

  return (
    <>
      <input
        type="file"
        ref={input}
        onChange={onFileSelect}
        style={{ display: "none" }}
      />
      <AntdButton
        size="sm" 
        type="primary"
        icon=<UploadOutlined />  
        onClick={() => input.current.click()}
        >
        Load
      </AntdButton>
    </>
  );
}

export default Workspace;
