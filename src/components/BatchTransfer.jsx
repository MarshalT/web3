import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, message, Space, Typography, Upload, AutoComplete } from 'antd';
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Text } = Typography;

const BatchTransfer = ({ web3, account }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [transfers, setTransfers] = useState([]);
  const [totalAmount, setTotalAmount] = useState('0');
  const [lastInputAddress, setLastInputAddress] = useState('');

  // 从 localStorage 获取搜索历史
  const getSearchHistory = () => {
    try {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('获取搜索历史失败:', error);
      return [];
    }
  };

  // 保存搜索历史
  const saveSearchHistory = (address) => {
    try {
      if (!address) return;
      
      let history = getSearchHistory();
      // 删除重复的地址
      history = history.filter(item => item !== address);
      // 将新地址添加到开头
      history.unshift(address);
      // 只保留最近10条记录
      history = history.slice(0, 10);
      
      localStorage.setItem('searchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 处理Excel上传
  const handleExcelUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);
        
        const formattedTransfers = data.map((row, index) => ({
          key: index,
          address: row.address?.toString().trim(),
          amount: row.amount?.toString().trim()
        })).filter(t => t.address && t.amount);

        setTransfers([...transfers, ...formattedTransfers]);
        updateTotalAmount([...transfers, ...formattedTransfers]);
      } catch (error) {
        message.error('Excel解析失败');
        console.error('Excel解析错误:', error);
      }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  // 更新总金额
  const updateTotalAmount = (transfers) => {
    const total = transfers.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    setTotalAmount(total.toString());
  };

  // 更新转账记录
  const updateTransfer = (key, field, value) => {
    const newTransfers = transfers.map(t => {
      if (t.key === key) {
        if (field === 'address') {
          setLastInputAddress(value);
        }
        return { ...t, [field]: value };
      }
      return t;
    });
    setTransfers(newTransfers);
    if (field === 'amount') {
      updateTotalAmount(newTransfers);
    }
  };

  // 添加新的转账记录
  const addTransfer = () => {
    const newTransfers = [...transfers];
    const lastTransfer = newTransfers[newTransfers.length - 1];
    
    const newTransfer = {
      key: Date.now(),
      address: '',
      amount: ''
    };
    
    newTransfers.push(newTransfer);
    setTransfers(newTransfers);
    
    // 设置表单值，获取上一条记录的地址和金额
    const formValues = form.getFieldsValue();
    const lastAddress = lastTransfer ? 
      form.getFieldValue(['transfers', newTransfers.length - 2, 'address']) : 
      '';
    const lastAmount = lastTransfer ? 
      form.getFieldValue(['transfers', newTransfers.length - 2, 'amount']) : 
      '';
      
    form.setFieldsValue({
      transfers: [
        ...(formValues.transfers || []),
        { 
          address: lastAddress, 
          amount: lastAmount  // 添加金额的自动填充
        }
      ]
    });
  };

  // 删除转账记录
  const removeTransfer = (key) => {
    const newTransfers = transfers.filter(t => t.key !== key);
    setTransfers(newTransfers);
    updateTotalAmount(newTransfers);
  };

  // 执行批量转账
  const handleBatchTransfer = async () => {
    if (!web3 || !account) {
      message.error('请先连接钱包');
      return;
    }

    if (transfers.length === 0) {
      message.error('请先添加转账记录');
      return;
    }

    // 验证所有地址和金额
    const invalidTransfers = transfers.filter(t => 
      !web3.utils.isAddress(t.address) || isNaN(Number(t.amount)) || Number(t.amount) <= 0
    );

    if (invalidTransfers.length > 0) {
      message.error('存在无效的地址或金额');
      return;
    }

    setLoading(true);
    try {
      // 获取当前账户余额
      const balance = await web3.eth.getBalance(account);
      const totalWei = web3.utils.toWei(totalAmount.toString(), 'ether');
      
      // 余额比较 - 确保使用 BigInt
      if (BigInt(balance) < BigInt(totalWei)) {
        throw new Error('余额不足');
      }

      // 获取当前 nonce
      const nonce = await web3.eth.getTransactionCount(account);
      
      // 获取当前 gas 价格
      const gasPrice = await web3.eth.getGasPrice();

      // 准备所有交易
      const transactions = [];
      
      for (let i = 0; i < transfers.length; i++) {
        const transfer = transfers[i];
        const valueWei = web3.utils.toWei(transfer.amount.toString(), 'ether');
        
        try {
          // 估算 gas
          const gasEstimate = await web3.eth.estimateGas({
            from: account,
            to: transfer.address,
            value: valueWei,
            gasPrice: gasPrice
          });

          // 构建交易对象 - 所有数值都转换为十六进制
          const tx = {
            from: account,
            to: transfer.address,
            value: web3.utils.numberToHex(valueWei),
            gas: web3.utils.numberToHex(Math.ceil(Number(gasEstimate) * 1.1)),
            gasPrice: web3.utils.numberToHex(gasPrice),
            nonce: web3.utils.numberToHex(nonce + i)
          };

          transactions.push(tx);
        } catch (error) {
          console.error(`估算第 ${i + 1} 笔交易的 gas 失败:`, error);
          throw new Error(`估算第 ${i + 1} 笔交易的 gas 失败`);
        }
      }

      // 执行所有交易
      const results = await Promise.all(
        transactions.map(tx => {
          return new Promise((resolve, reject) => {
            web3.eth.sendTransaction(tx)
              .on('transactionHash', hash => {
                console.log('交易已提交:', hash);
                resolve(hash);
              })
              .on('error', error => {
                console.error('交易失败:', error);
                reject(error);
              });
          });
        })
      );

      message.success('批量转账成功');
      // 清空表单
      form.resetFields();
      setTransfers([{ key: Date.now(), address: '', amount: '' }]);
      setTotalAmount('0');

    } catch (error) {
      console.error('批量转账失败:', error);
      message.error(error.message || '批量转账失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '接收地址',
      dataIndex: 'address',
      key: 'address',
      render: (_, record, index) => (
        <Form.Item
          name={['transfers', index, 'address']}
          noStyle
        >
          <Input
            placeholder="输入ETH地址"
            onChange={(e) => updateTransfer(record.key, 'address', e.target.value.trim())}
            style={{ width: '100%' }}
            // autoComplete="on"
            // name="eth-address"
          />
        </Form.Item>
      )
    },
    {
      title: '金额 (ETH)',
      dataIndex: 'amount',
      key: 'amount',
      render: (_, record, index) => (
        <Form.Item
          name={['transfers', index, 'amount']}
          noStyle
        >
          <Input
            placeholder="输入转账金额"
            onChange={(e) => updateTransfer(record.key, 'amount', e.target.value.trim())}
            style={{ width: '100%' }}
            // autoComplete="on"
            // name="eth-amount"
          />
        </Form.Item>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => removeTransfer(record.key)}
        >
          删除
        </Button>
      )
    }
  ];

  // 组件初始化时添加第一条记录
  useEffect(() => {
    if (transfers.length === 0) {
      addTransfer();
    }
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form
        form={form}
        name="batchTransfer"
        onFinish={handleBatchTransfer}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <Upload
              accept=".xlsx,.xls"
              beforeUpload={handleExcelUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                上传Excel文件
              </Button>
            </Upload>

            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={addTransfer}
            >
              添加转账
            </Button>
          </Space>

          <Text>总转账金额: {totalAmount} ETH</Text>

          <Table
            columns={columns}
            dataSource={transfers}
            pagination={false}
            size="small"
            rowKey="key"
          />

          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            block
          >
            批量转账
          </Button>
        </Space>
      </Form>
    </Space>
  );
};

export default BatchTransfer;