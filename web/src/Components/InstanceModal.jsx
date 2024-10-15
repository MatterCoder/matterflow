import { Modal as AntdModal, Divider } from "antd";
import InstanceEditor from "./InstanceEditor";

const InstanceModal = ({ show, handleClose, instanceName, instanceId }) => {
  return (
    <AntdModal
      open={show}
      onClose={handleClose}
      onCancel={handleClose}
      centered
      title={instanceName}
      footer={null}
      width={"90%"}
    >
      <div className="w-full">
        <Divider />
        <InstanceEditor instance_id={instanceId} handleClose={handleClose} />
      </div>
    </AntdModal>
  );
};

export default InstanceModal;
