import { CloseCircleFilled, SaveOutlined, DatabaseOutlined, ExportOutlined, UploadOutlined, ClearOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import { Button as AntdButton, Modal as AntdModal, notification } from "antd";
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
const { confirm } = AntdModal;

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

  const engine = useRef(createEngine()).current;
  const model = useRef(new DiagramModel()).current;
  const flow_id = props.params?.flow_id;
  //we can access the flow_id by using props.params.flow_id

  const diagramData = useRef(null);

  const [showNodeMenu, setShowNodeMenu] = useState(true);
  const [api, contextHolder] = notification.useNotification();

  //const navigate = useNavigate();

  engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  engine.getLinkFactories().registerFactory(new MFLinkFactory());
  engine.getPortFactories().registerFactory(new MFPortFactory());
  engine.setModel(model);
  engine.setMaxNumberPointsPerLink(0);

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

  /**
   * Handle node creation from the drag-and-drop event
   * @param {Object} event - The drag-and-drop event
   */
  const handleNodeCreation = (event) => {
    const evtData = event.dataTransfer.getData("storm-diagram-node");
    if (!evtData) return;
    const data = JSON.parse(evtData);
    const node = new CustomNodeModel(data.nodeInfo, data.config);
    const point = engine.getRelativeMousePoint(event);
    node.setPosition(point);
    API.addNode(node)
      .then(() => {
        model.addNode(node);
        engine.repaintCanvas();
        setIsDirty(true);
      })
      .catch((err) => console.log(err));
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
          />
          <ModelMenu models={models} onUpload={getAvailableModels} />
        </Col>
        <Col
          xs={showNodeMenu ? 7 : 9}
          style={{ paddingLeft: 0, marginTop: 24 }}
        >
          <div
            style={{ position: "relative", flexGrow: 1 }}
            onDrop={handleNodeCreation}
            onDragOver={(event) => event.preventDefault()}
          >
            <div style={{ position: "relative", zIndex: 100, maxWidth: "80%" }}>
              <div style={{ position: "absolute", top: 8, left: 8 }}>
                <AntdButton
                  size="sm"
                  type="primary"
                  icon=<DatabaseOutlined />
                  onClick={() => {
                      alert(JSON.stringify(model.serialize()));
                  }}
                >
                ShowData
                </AntdButton>{" "}
                <AntdButton
                  size="sm"
                  type="primary"
                  icon=<ExportOutlined />
                  onClick={() => {
                    API.save(model.serialize());
                  }}
                >
                  Export
                </AntdButton>{" "}
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
                  icon=<PlayCircleOutlined />  
                >
                  Execute
                </AntdButton>{" "}
                <AntdButton 
                  size="sm" 
                  type="primary"
                  icon=<SaveOutlined />  
                  onClick={() => handleSave(flow_id)}
                  >
                  Save
                </AntdButton>
                <WatermarkText text={processId}/>
              </div>
            </div>
            <CanvasWidget className="diagram-canvas" engine={engine} />
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
