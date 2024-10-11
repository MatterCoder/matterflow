import { CloseCircleFilled } from "@ant-design/icons";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import { Button as AntdButton, Modal as AntdModal, notification } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { Button, Col, Offcanvas, Row } from "react-bootstrap";
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
const { confirm } = AntdModal;

/**
 * Workspace Component: Manages the diagram workspace and handles node operations.
 */
const Workspace = (props) => {
  const [nodes, setNodes] = useState([]);
  const [flows, setFlows] = useState([]);
  const [models, setModels] = useState([]);
  const [show, setShow] = useState(false);
  const [globals, setGlobals] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const engine = useRef(createEngine()).current;
  const model = useRef(new DiagramModel()).current;
  const flow_id = props.params?.flow_id;
  //we can access the flow_id by using props.params.flow_id

  const diagramData = useRef(null);

  const [showNodeMenu, setShowNodeMenu] = useState(true);
  const [api, contextHolder] = notification.useNotification();
  const [firstTime, setFirstTime] = useState(true);

  //const navigate = useNavigate();

  engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  engine.getLinkFactories().registerFactory(new MFLinkFactory());
  engine.getPortFactories().registerFactory(new MFPortFactory());
  engine.setModel(model);
  engine.setMaxNumberPointsPerLink(0);

  useEffect(() => {
    if (flow_id && flow_id != "new") {
      setFirstTime(false);
      API.getFlow(flow_id)
        .then((value) => {
          try {
            diagramData.current = JSON.parse(value.data.json_data)["react"];
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
        .catch((err) => (window.location = `/`));
    } else {
      API.initWorkflow(model)
        .then(() => {
          getAvailableNodes();
          getGlobalVars();
        })
        .catch((err) => console.log(err));
      setFirstTime(true);
      //Open Banner Message
      showBannerMessage();
    }
  }, [flow_id]);

  const showBannerMessage = () => {
    api.open({
      message: "Start",
      description:(
        <>
<div>
  <ul>
    <li>
        <strong>New pipeline</strong>
        <p>Open a new untitled pipeline and drag and drop components to design and develop your data flow.</p>
    </li>
  </ul>
</div>

        </>
      ),
      duration: 0, //0 means indefinite, pass a +ve number to hide it after that time
      placement: "topRight",
      onClick: () => {
        //Perform any action on click on message
        console.log("Banner Message Click");
      },
      onClose: () => {
        //Perform whatever action wanted after message is closed
        console.log("Banner Message Closed");
      },
    });
  };

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
   * Retrieve available flows from server to display in the menu
   */
  const getAvailableFlows = () => {
    API.getFlows()
      .then((flows) => setFlows(flows))
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
          name: JSON.parse(json_data)["react"]["id"],
          description: "flow-" + Math.random().toString(36).substring(7),
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

  /**
   * Handlers for offcanvas dialog
   */
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
            <div style={{ position: "relative", zIndex: 100, maxWidth: "70%" }}>
              <div style={{ position: "absolute", top: 8, left: 8 }}>
                <Button
                  size="sm"
                  onClick={() => {
                    alert(JSON.stringify(model.serialize()));
                  }}
                >
                  ShowData
                </Button>{" "}
                <Button
                  size="sm"
                  onClick={() => {
                    API.save(model.serialize());
                  }}
                >
                  Export
                </Button>{" "}
                <FileUpload handleData={load} />{" "}
                <Button size="sm" onClick={clear}>
                  Clear
                </Button>{" "}
                <Button size="sm" onClick={execute}>
                  Execute
                </Button>{" "}
                <Button size="sm" onClick={handleShow}>
                  Console
                </Button>{" "}
                <Button size="sm" onClick={() => handleSave(flow_id)}>
                  Save
                </Button>
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
      <Button size="sm" onClick={() => input.current.click()}>
        Load
      </Button>
    </>
  );
}

export default Workspace;
