import { useState, useEffect } from "react";
import * as API from "../API";
import { ListGroup, Button, InputGroup, FormControl } from "react-bootstrap";
import StatusLight from "./StatusLight";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  Modal as AntdModal,
  Spin,
  Button as AntdButton,
  Tooltip as AntdTooltip,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
const { confirm } = AntdModal;

const PROCESS_POLL_TIME = 10000; // 10 seconds

const useFetch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await API.getFlows();
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch };
};

const FlowList = (props) => {
  const { data, loading, error, refetch } = useFetch();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const selected_flow_id = props?.flow_id;

  const [processes, setProcesses] = useState([]);
  const [pollInterval, setPollInterval] = useState(PROCESS_POLL_TIME);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);

  // Construct the iframe source dynamically based on the current host and protocol
  const iframeSrc = `${window.location.protocol}//${window.location.hostname}:7002/`;

  useEffect(() => {
    const pollProcesses = async () => {
      try {
        const response = await API.getProcesses();
        setProcesses(JSON.parse(response.data));
      } catch (error) {
        console.error(error);
      }
    };

    pollProcesses();

    const intervalId = setInterval(pollProcesses, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollInterval]);

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Save Flow First
    </Tooltip>
  );

  // Handler to alert the flow name and make the flow name bold
  const handleFlowClick = (flow) => {
    if (selected_flow_id == flow.id) {
      return;
    }
    if (props.isDirty) {
      confirm({
        title: "Are you sure? You will lose unsaved work.",
        okButtonProps: {
          danger: true,
        },
        onOk() {
          window.location.href = `/${flow.id}`;
        },
      });
    } else {
      window.location.href = `/${flow.id}`;
    }
  };

  const handleDelete = async (flow_id, flow_name) => {
    API.deleteProcess(flow_name).then(() => {
      console.log("Process file deleted successfully");
    });
    API.deleteFlow(flow_id).then(() => {
      console.log("Flow deleted successfully");
      if (selected_flow_id == flow_id) {
        //if we are deleting the currently selected flow we need to redirect
        window.location = `/`;
      } else {
        refetch();
      }
    });
  };

  // Handler to start renaming a flow
  const handleRename = (flowId, currentName) => {
    setRenamingId(flowId);
    setRenameValue(currentName);
  };

  // Handler to confirm renaming
  const handleRenameConfirm = (flowId) => {
    const inputData = {
      id: flowId,
      description: renameValue,
    };
    API.updateFlow(flowId, inputData).then(() => {
      console.log("Flow saved successfully");
      refetch();
    });

    setRenamingId(null);
  };

  // Handler to add a new flow and make it bold
  const handleAddFlow = () => {
    if (props.isDirty) {
      confirm({
        title: "Are you sure? You will lose unsaved work.",
        okButtonProps: {
          danger: true,
        },
        onOk() {
          props.onNewFlow();
        },
      });
    } else {
      props.onNewFlow();
    }
  };

  // Function to calculate flow process status
  const getFlowStatus = (flow_name) => {
    //returns option of "configured", "configured", "complete"

    //filter the processes to find the process matching this flow
    const flowProcesses = processes.filter(
      (process) => process.name == flow_name
    );
    //const flowProcesses = processes.filter((process) => process.name == "foo");

    if (flowProcesses.length === 0) {
      return "";
    } else if (flowProcesses.length > 1) {
      console.log("Multiple processes found for flow: " + flow_name);
      return "unconfigured";
    } else {
      if (flowProcesses[0]["statename"] == "RUNNING") {
        return "complete";
      } else {
        return "configured";
      }
    }
  };

  // Handler to change state
  const handleChangeState = (flowName) => {
    //lets try to start the flow process
    //flowName = 'foo'
    const flowProcesses = processes.filter(
      (process) => process.name == flowName
    );

    if (flowProcesses.length === 0) {
      API.addProcess(flowName)
        .then(() => {
          console.log("Added Process Successfully");
          setPollInterval(pollInterval + 1); //lets change the polling interval to force a refetch
        })
        .catch((err) => console.log(err));
    } else {
      if (flowProcesses[0]["statename"] == "RUNNING") {
        API.stopProcess(flowName)
          .then(() => {
            console.log("Stopped Process Successfully");
            setPollInterval(pollInterval + 1); //lets change the polling interval to force a refetch
          })
          .catch((err) => console.log(err));
      } else {
        API.startProcess(flowName)
          .then(() => {
            console.log("Started Process Successfully");
            setPollInterval(pollInterval - 1); //lets change the polling interval to force a refetch
          })
          .catch((err) => console.log(err));
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>No data.</div>;
  }

  if (Object.keys(data).length === 0) {
    return <div>You have no saved flows.</div>;
  }

  // Handler to alert the flow name and make the flow name bold
  return (
    <div>
      <div
        style={{
          maxHeight: "300px", // Maximum height of 5 items with a scroll bar
          overflowY: data.length > 5 ? "scroll" : "auto",
        }}
      >
        <ListGroup>
          {selected_flow_id == "new" && (
            <ListGroup.Item
              key={"new"} // Using uniqueId for key
              className="d-flex justify-content-between align-items-center"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
                  <span
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold", // Make flow name bold if clicked
                    }}
                  >
                    *unsaved_flow
                  </span>
                </div>
                {/* Action buttons: Rename and Delete */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                  >
                    <AntdButton type="text" icon={<EditOutlined />} />
                  </OverlayTrigger>
                  <AntdTooltip title="Delete">
                    <AntdButton
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => (window.location = `/`)}
                    />
                  </AntdTooltip>
                  <Button variant="link" size="sm">
                    <StatusLight />
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          )}

          {[...data].reverse().map((flow) => (
            <ListGroup.Item
              key={flow.name} // Using uniqueId for key
              className="d-flex justify-content-between align-items-center"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
                  {/* Flow name or Rename Input */}
                  {renamingId === flow.id ? (
                    <InputGroup size="sm" style={{ maxWidth: "200px" }}>
                      <FormControl
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                      />
                      <Button
                        variant="outline-success"
                        onClick={() => handleRenameConfirm(flow.id)}
                      >
                        Save
                      </Button>
                    </InputGroup>
                  ) : (
                    <span
                      onClick={() => handleFlowClick(flow)}
                      style={{
                        cursor: "pointer",
                        fontWeight:
                          selected_flow_id == flow.id ? "bold" : "normal", // Make flow name bold if clicked
                      }}
                    >
                      {selected_flow_id == flow.id && props.isDirty ? "*" : ""}
                      {flow.description}
                    </span>
                  )}
                </div>

                {/* Action buttons: Rename and Delete */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AntdTooltip title="Rename">
                    <AntdButton
                      type="text"
                      onClick={() => handleRename(flow.id, flow.description)}
                      icon={<EditOutlined />}
                    />
                  </AntdTooltip>
                  <AntdTooltip title="Delete">
                    <AntdButton
                      type="text"
                      onClick={() => handleDelete(flow.id, flow.name)}
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </AntdTooltip>
                  <Button
                    variant="link"
                    size="sm"
                    // className="me-2"
                    onClick={() => handleChangeState(flow.name)}
                  >
                    <StatusLight status={getFlowStatus(flow.name)} />
                  </Button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      {/* Button to add new flow and browse processes*/}
      <div className="mt-3 text-center">
        <Button variant="outline-success" onClick={handleAddFlow}>
          Add New Flow
        </Button>
        <Button
          variant="outline-success"
          className="ms-2"
          onClick={() => {
            setShowProcessModal(true);
            setLoadingProcesses(true);
          }}
        >
          View Processes
        </Button>

        <AntdModal
          open={showProcessModal}
          width={"90%"}
          centered
          footer={null}
          onCancel={() => {
            setShowProcessModal(false);
          }}
          destroyOnClose
        >
          {loadingProcesses && <Spin spinning />}
          <iframe
            src={iframeSrc}
            style={{ width: "100%", minHeight: "400px" }}
            onLoad={() => {
              setLoadingProcesses(false);
            }}
          />
        </AntdModal>
      </div>
    </div>
  );
};

export default FlowList;
