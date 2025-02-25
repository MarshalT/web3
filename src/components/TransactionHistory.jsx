import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, message, Space, Modal, Typography, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const TransactionHistory = ({ web3 }) => {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [lastBlock, setLastBlock] = useState(null);
  const [form] = Form.useForm();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentTx, setCurrentTx] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [searchParams, setSearchParams] = useState({
    startBlock: 0,
    endBlock: 0,
    pageSize: 20,
    currentPage: 1
  });

  // 添加 Arbiscan 相关常量
  const ARBISCAN_URL = {
    mainnet: 'https://arbiscan.io',
    testnet: 'https://testnet.arbiscan.io'
  };

  // 获取当前网络的 Arbiscan URL
  const getArbiscanUrl = async () => {
    try {
      const chainId = await web3.eth.getChainId();
      // 将 BigInt 转换为普通数字
      const networkId = Number(chainId);
      console.log('当前网络的 ChainId:', networkId);
      return networkId === 42161 ? ARBISCAN_URL.mainnet : ARBISCAN_URL.testnet;
    } catch (error) {
      console.error('获取网络ID失败:', error);
      return ARBISCAN_URL.mainnet;
    }
  };

  // 打开 Arbiscan 地址页面
  const openArbiscan = async (address) => {
    try {
      const baseUrl = await getArbiscanUrl();
      window.open(`${baseUrl}/address/${address}`, '_blank');
    } catch (error) {
      console.error('打开 Arbiscan 失败:', error);
      // 默认使用主网
      window.open(`${ARBISCAN_URL.mainnet}/address/${address}`, '_blank');
    }
  };

  // 打开 Arbiscan 交易页面
  const openArbiscanTx = async (hash) => {
    try {
      const baseUrl = await getArbiscanUrl();
      window.open(`${baseUrl}/tx/${hash}`, '_blank');
    } catch (error) {
      console.error('打开 Arbiscan 交易页面失败:', error);
      // 默认使用主网
      window.open(`${ARBISCAN_URL.mainnet}/tx/${hash}`, '_blank');
    }
  };

  // 格式化地址显示
  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-';

  // 格式化数值
  const formatBigInt = (value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'string' && value.startsWith('0x')) {
      return BigInt(value).toString();
    }
    return value ? value.toString() : '0';
  };

  // 修改 getBlockNumberByTimestamp 函数
  const getBlockNumberByTimestamp = async (timestamp) => {
    try {
      const latestBlock = Number(await web3.eth.getBlockNumber());
      
      // 先获取最新区块的时间戳
      const latestBlockData = await web3.eth.getBlock(latestBlock);
      const latestTimestamp = Number(latestBlockData.timestamp);
      
      // 计算每个区块的平均时间（Arbitrum 约 0.25秒一个区块）
      const avgBlockTime = 0.25;
      
      // 估算目标区块号
      const timeDiff = latestTimestamp - timestamp;
      const blockDiff = Math.floor(timeDiff / avgBlockTime);
      let estimatedBlock = latestBlock - blockDiff;
      
      // 二分查找精确区块
      let left = Math.max(0, estimatedBlock - 10000);
      let right = Math.min(latestBlock, estimatedBlock + 10000);
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const block = await web3.eth.getBlock(mid);
        
        if (!block) continue;
        
        const blockTimestamp = Number(block.timestamp);
        if (blockTimestamp === timestamp) {
          return mid;
        } else if (blockTimestamp < timestamp) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return left;
    } catch (error) {
      console.error('获取区块号失败:', error);
      return 0;
    }
  };

  // 修改获取交易记录的函数
  const getTransactions = async (values) => {
    if (!web3 || !values.address) {
      message.error('请输入要查询的地址');
      return;
    }

    const address = values.address.trim().toLowerCase();
    if (!web3.utils.isAddress(address)) {
      message.error('无效的地址格式');
      return;
    }

    setLoading(true);
    try {
      const currentBlock = Number(await web3.eth.getBlockNumber());
      let startBlock = Math.max(0, currentBlock - 1000);
      let endBlock = currentBlock;

      // 如果选择了日期范围，计算对应的区块号
      if (dateRange) {
        const [startDate, endDate] = dateRange;
        
        // 转换为 UTC 时间戳
        const startTimestamp = Math.floor(startDate.valueOf() / 1000);
        const endTimestamp = Math.floor(endDate.valueOf() / 1000);
        
        console.log('查询时间范围:', {
          start: new Date(startTimestamp * 1000).toUTCString(),
          end: new Date(endTimestamp * 1000).toUTCString()
        });

        startBlock = await getBlockNumberByTimestamp(startTimestamp);
        endBlock = await getBlockNumberByTimestamp(endTimestamp);
        
        console.log('对应区块范围:', { startBlock, endBlock });
      }

      console.log(`查询区块范围: ${startBlock} - ${endBlock}`);

      // 直接查询与地址相关的交易
      const foundTransactions = [];

      // 查询发送的交易
      const fromTxs = await web3.eth.getPastLogs({
        fromBlock: web3.utils.toHex(startBlock),
        toBlock: web3.utils.toHex(endBlock),
        topics: [
          null,
          web3.utils.padLeft(address, 64)
        ]
      });

      // 查询接收的交易
      const toTxs = await web3.eth.getPastLogs({
        fromBlock: web3.utils.toHex(startBlock),
        toBlock: web3.utils.toHex(endBlock),
        topics: [
          null,
          null,
          web3.utils.padLeft(address, 64)
        ]
      });

      // 合并交易并去重
      const allTxHashes = new Set([
        ...fromTxs.map(tx => tx.transactionHash),
        ...toTxs.map(tx => tx.transactionHash)
      ]);

      // 获取交易详情
      for (const txHash of allTxHashes) {
        try {
          const tx = await web3.eth.getTransaction(txHash);
          if (!tx) continue;

          const receipt = await web3.eth.getTransactionReceipt(txHash);
          if (!receipt) continue;

          const block = await web3.eth.getBlock(tx.blockNumber);
          if (!block) continue;

          foundTransactions.push({
            key: tx.hash,
            hash: tx.hash,
            blockNumber: formatBigInt(tx.blockNumber),
            from: tx.from,
            to: tx.to,
            value: web3.utils.fromWei(formatBigInt(tx.value), 'ether'),
            gasUsed: formatBigInt(receipt.gasUsed),
            gasPrice: formatBigInt(tx.gasPrice),
            status: receipt.status ? '成功' : '失败',
            timestamp: Number(block.timestamp),
            type: tx.from.toLowerCase() === address ? '发送' : '接收'
          });

          // 更新进度
          const progress = Math.round((foundTransactions.length / allTxHashes.size) * 100);
          message.loading({ content: `已处理 ${progress}%`, key: 'progress' });
        } catch (error) {
          console.error('处理交易失败:', error);
          continue;
        }
      }

      // 按时间戳排序
      foundTransactions.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(foundTransactions);
      setLastBlock(currentBlock);
      message.success(`找到 ${foundTransactions.length} 笔交易`);
    } catch (error) {
      console.error('获取交易记录失败:', error);
      message.error('获取交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 显示交易详情
  const showTransactionDetail = (record) => {
    setCurrentTx(record);
    setDetailVisible(true);
  };

  // 修改时间显示格式
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'  // 使用 UTC 时间
    }) + ' UTC';  // 标明是 UTC 时间
  };

  const columns = [
    {
      title: '交易哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: hash => (
        <Space>
          <Button 
            type="link" 
            onClick={() => openArbiscanTx(hash)}
            style={{ padding: 0 }}
          >
            {formatAddress(hash)}
          </Button>
        </Space>
      )
    },
    {
      title: '区块号',
      dataIndex: 'blockNumber',
      key: 'blockNumber'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Text type={type === '发送' ? 'danger' : 'success'}>
          {type}
        </Text>
      )
    },
    {
      title: '发送方',
      dataIndex: 'from',
      key: 'from',
      render: from => formatAddress(from)
    },
    {
      title: '接收方',
      dataIndex: 'to',
      key: 'to',
      render: to => formatAddress(to)
    },
    {
      title: '金额 (ETH)',
      dataIndex: 'value',
      key: 'value',
      render: value => Number(value).toFixed(6)
    },
    {
      title: 'Gas Used',
      dataIndex: 'gasUsed',
      key: 'gasUsed',
      render: gasUsed => Number(gasUsed).toFixed(0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Text type={status === '成功' ? 'success' : 'danger'}>
          {status}
        </Text>
      )
    },
    {
      title: '时间 (UTC)',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: timestamp => formatTimestamp(timestamp)
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form
        form={form}
        name="searchTransaction"
        onFinish={getTransactions}
        layout="vertical"
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form.Item
            name="address"
            rules={[{ required: true, message: '请输入要查询的地址' }]}
          >
            <Input
              placeholder="请输入以太坊地址"
              allowClear
              style={{ width: '100%' }}
              suffix={
                <Button 
                  type="link" 
                  icon={<SearchOutlined />}
                  onClick={() => {
                    const address = form.getFieldValue('address');
                    if (address && web3.utils.isAddress(address)) {
                      openArbiscan(address);
                    }
                  }}
                  style={{ padding: 0 }}
                >
                  Arbiscan
                </Button>
              }
            />
          </Form.Item>

          <Form.Item name="dateRange">
            <RangePicker
              showTime
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={loading}
            block
          >
            查询
          </Button>
        </Space>
      </Form>

      {lastBlock && (
        <Text type="secondary">
          最新区块: {lastBlock}
        </Text>
      )}

      <Table
        columns={columns}
        dataSource={transactions}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        rowKey="hash"
        loading={loading}
      />

      <Modal
        title="交易详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button 
            key="arbiscan" 
            type="primary"
            onClick={() => currentTx && openArbiscanTx(currentTx.hash)}
          >
            在 Arbiscan 中查看
          </Button>,
          <Button 
            key="close" 
            onClick={() => setDetailVisible(false)}
          >
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentTx && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>交易哈希：</Text>
            <Text>{currentTx.hash}</Text>
            <Text strong>区块号：</Text>
            <Text>{currentTx.blockNumber}</Text>
            <Text strong>发送地址：</Text>
            <Text>{currentTx.from}</Text>
            <Text strong>接收地址：</Text>
            <Text>{currentTx.to}</Text>
            <Text strong>金额：</Text>
            <Text>{Number(currentTx.value).toFixed(6)} ETH</Text>
            <Text strong>Gas消耗：</Text>
            <Text>{Number(currentTx.gasUsed).toFixed(0)}</Text>
            <Text strong>状态：</Text>
            <Text>{currentTx.status}</Text>
            <Text strong>时间：</Text>
            <Text>{new Date(currentTx.timestamp).toLocaleString()}</Text>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default TransactionHistory;