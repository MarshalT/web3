import React, { useState } from 'react';
import { Form, Input, Button, Table, message, Space, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import Web3 from 'web3';

const { Text } = Typography;

const AddressGenerator = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 生成指定数量的地址
  const handleGenerate = async (values) => {
    const { count } = values;
    setLoading(true);
    try {
      const web3 = new Web3();
      const newAddresses = [];

      for (let i = 0; i < count; i++) {
        const account = web3.eth.accounts.create();
        newAddresses.push({
          key: account.address,
          address: account.address,
          privateKey: account.privateKey
        });
      }

      setAddresses(newAddresses);
      message.success(`成功生成 ${count} 个地址`);
    } catch (error) {
      console.error('生成地址失败:', error);
      message.error('生成地址失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出地址信息
  const handleExport = () => {
    try {
      const data = addresses.map(item => ({
        address: item.address,
        privateKey: item.privateKey
      }));

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ethereum_addresses_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('地址信息导出成功');
    } catch (error) {
      console.error('导出地址失败:', error);
      message.error('导出地址失败');
    }
  };

  const columns = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: address => (
        <Text copyable>{address}</Text>
      )
    },
    {
      title: '私钥',
      dataIndex: 'privateKey',
      key: 'privateKey',
      render: privateKey => (
        <Text copyable={{ text: privateKey }}>
          {`${privateKey.slice(0, 6)}...${privateKey.slice(-4)}`}
        </Text>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form
        form={form}
        name="generateAddresses"
        onFinish={handleGenerate}
        layout="inline"
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="count"
          rules={[
            { required: true, message: '请输入要生成的地址数量' },
            {
              type: 'number',
              min: 1,
              max: 1000,
              transform: (value) => Number(value),
              message: '请输入1-1000之间的数量'
            }
          ]}
          style={{
            width: 'calc(100% - 200px)',
            '--ant-color-error': '#ff4d4f',
            '--ant-color-error-border': '#ff7875',
            '--ant-color-error-hover': '#ff7875'
          }}
        >
          <Input
            type="number"
            placeholder="请输入要生成的地址数量（1-1000）"
            min={1}
            max={1000}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            生成地址
          </Button>
        </Form.Item>
        <Form.Item>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={addresses.length === 0}
          >
            导出地址
          </Button>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={addresses}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </Space>
  );
};

export default AddressGenerator;