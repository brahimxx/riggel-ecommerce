import React from "react";
import { Button, message, Popconfirm } from "antd";
const confirm = (e) => {
  console.log(e);
  message.success("Click on Yes");
};
const cancel = (e) => {
  console.log(e);
  message.error("Click on No");
};
const DeletePopConfirm = ({ title, description, icon }) => (
  <Popconfirm
    title={title}
    description={description}
    onConfirm={confirm}
    onCancel={cancel}
    okText="Yes"
    cancelText="No"
  >
    <Button danger icon={icon}>
      Delete
    </Button>
  </Popconfirm>
);
export default DeletePopConfirm;
