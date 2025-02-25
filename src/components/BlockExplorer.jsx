import React, { useState } from 'react';
import { Input, Button, Card, Descriptions, message, Space, Typography, Table, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

const BlockExplorer = ({ web3 }) => {
  const [loading, setLoading] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [txInfo, setTxInfo] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [networkInfo, setNetworkInfo] = useState(null);
  const [form] = Form.useForm();

  // 获取网络信息
  const getNetworkInfo = async () => {
    try {
      const chainId = await web3.eth.getChainId();
      // 根据 chainId 判断网络类型
      let networkType;
      switch (Number(chainId)) {
        case 42161:
          networkType = 'Arbitrum One';
          break;
        case 421613:
          networkType = 'Arbitrum Goerli';
          break;
        default:
          networkType = 'Unknown';
      }
      setNetworkInfo({ chainId: Number(chainId), networkType });
    } catch (error) {
      console.error('获取网络信息失败:', error);
    }
  };

  // 组件加载时获取网络信息
  React.useEffect(() => {
    if (web3) {
      getNetworkInfo();
    }
  }, [web3]);

  // 处理 BigInt 值
  const formatBigInt = (value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value || '0';
  };

  // 添加 Arbitrum 网络检查函数
  const isArbitrumNetwork = (chainId) => {
    // Arbitrum One: 42161, Arbitrum Goerli: 421613
    return [42161, 421613].includes(Number(chainId));
  };

  // 通过时间戳获取区块号
  const getBlockNumberByTimestamp = async (timestamp) => {
    try {
      const latestBlock = await web3.eth.getBlockNumber();
      let left = 0;
      let right = latestBlock;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const block = await web3.eth.getBlock(mid);
        
        if (!block) continue;
        
        if (block.timestamp === timestamp) {
          return mid;
        } else if (block.timestamp < timestamp) {
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

  const getInfo = async () => {
    if (!web3) {
      message.error('请先连接钱包');
      return;
    }

    const values = form.getFieldsValue();
    const searchValue = values.searchValue;

    if (!searchValue) {
      message.error('请输入区块号、区块哈希或交易哈希');
      return;
    }

    setSearchValue(searchValue.trim());
    setLoading(true);
    try {
      // 获取最新区块号和网络信息
      const latestBlock = await web3.eth.getBlockNumber();
      const chainId = await web3.eth.getChainId();
      const isArbitrum = isArbitrumNetwork(chainId);
      console.log('Network info:', { chainId, isArbitrum, latestBlock });

      if (searchValue.startsWith('0x')) {
        // 验证哈希格式
        if (!/^0x[0-9a-fA-F]{64}$/.test(searchValue)) {
          throw new Error('无效的哈希格式');
        }

        try {
          // 先尝试获取交易信息
          const txData = await web3.eth.getTransaction(searchValue);
          console.log('Transaction data:', txData);

          if (txData) {
            // 是交易哈希
            const txReceipt = await web3.eth.getTransactionReceipt(searchValue);
            console.log('Transaction receipt:', txReceipt);
            
            // 获取区块信息以获取时间戳
            const block = await web3.eth.getBlock(txData.blockNumber);

            const formattedTxData = {
              ...txData,
              ...txReceipt,
              blockNumber: formatBigInt(txData.blockNumber),
              value: formatBigInt(txData.value),
              gasPrice: formatBigInt(txData.effectiveGasPrice || txData.gasPrice),
              gas: formatBigInt(txData.gas),
              gasUsed: formatBigInt(txReceipt?.gasUsed),
              cumulativeGasUsed: formatBigInt(txReceipt?.cumulativeGasUsed),
              status: txReceipt?.status ? '成功' : '失败',
              type: formatBigInt(txData.type),
              transactionIndex: formatBigInt(txReceipt?.transactionIndex),
              timestamp: block ? Number(block.timestamp) : null  // 添加时间戳
            };

            setTxInfo(formattedTxData);
            setBlockInfo(null);
            message.success('获取交易信息成功');
            return;
          }

          // 尝试获取区块信息
          const blockData = await web3.eth.getBlock(searchValue, true);
          if (!blockData) {
            throw new Error('未找到对应的区块或交易信息');
          }

          const formattedBlockData = formatBlockData(blockData);
          setBlockInfo(formattedBlockData);
          setTxInfo(null);
          message.success('获取区块信息成功');
        } catch (error) {
          console.error('Hash lookup error:', error);
          throw new Error('查询失败，请确认哈希值是否正确');
        }
      } else {
        let blockNumber = parseInt(searchValue);
        if (isNaN(blockNumber)) {
          throw new Error('无效的区块号');
        }
        if (blockNumber < 0) {
          throw new Error('区块号不能为负数');
        }
        if (blockNumber > latestBlock) {
          throw new Error(`区块号不能大于当前最新区块号 ${latestBlock}`);
        }
        
        try {
          // 针对 Arbitrum 网络的特殊处理
          let blockData;
          if (isArbitrum) {
            // Arbitrum 网络需要分两步获取数据
            blockData = await web3.eth.getBlock(blockNumber, false);
            if (blockData) {
              // 获取区块中的交易
              const txPromises = blockData.transactions.map(txHash => 
                web3.eth.getTransaction(txHash).catch(err => {
                  console.warn('Failed to fetch transaction:', txHash, err);
                  return null;
                })
              );
              const transactions = await Promise.all(txPromises);
              blockData.transactions = transactions.filter(tx => tx !== null);
            }
          } else {
            blockData = await web3.eth.getBlock(blockNumber, true);
          }

          console.log('Block data by number:', blockData);
          
          if (!blockData) {
            throw new Error('未找到该区块号对应的区块');
          }

          // 格式化数据
          const formattedBlockData = formatBlockData(blockData);
          setBlockInfo(formattedBlockData);
          setTxInfo(null);
          message.success('获取区块信息成功');
        } catch (error) {
          console.error('Block number lookup error:', error);
          throw new Error('区块号查询失败，请稍后重试');
        }
      }
    } catch (error) {
      console.error('查询失败:', error);
      message.error(error.message || '查询失败，请稍后重试');
      setBlockInfo(null);
      setTxInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 格式化区块数据
  const formatBlockData = (blockData) => {
    // 确保 transactions 数组中的每个交易都被正确格式化
    const formattedTransactions = blockData.transactions.map(tx => {
      // 处理不同类型的交易数据
      if (typeof tx === 'string') {
        // 如果是交易哈希，返回基本信息
        return {
          hash: tx,
          key: tx
        };
      }
      // 如果是完整的交易对象，格式化所有字段
      return {
        ...tx,
        value: formatBigInt(tx.value),
        gas: formatBigInt(tx.gas),
        gasPrice: formatBigInt(tx.gasPrice),
        nonce: formatBigInt(tx.nonce),
        key: tx.hash
      };
    });

    return {
      ...blockData,
      number: formatBigInt(blockData.number),
      gasLimit: formatBigInt(blockData.gasLimit),
      gasUsed: formatBigInt(blockData.gasUsed),
      baseFeePerGas: formatBigInt(blockData.baseFeePerGas),
      nonce: formatBigInt(blockData.nonce),
      transactions: formattedTransactions
    };
  };

  const formatTimestamp = (timestamp) => {
    return timestamp ? new Date(Number(timestamp) * 1000).toLocaleString() : '-';
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '-';
  };

  // 格式化时间戳
  const formatBlockTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  };

  // 计算区块时间差
  const getBlockAge = (timestamp) => {
    if (!timestamp) return '-';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(timestamp);
    
    if (diff < 60) return `${diff} 秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    return `${Math.floor(diff / 86400)} 天前`;
  };

  // 添加网络名称常量
  const NETWORK_NAMES = {
    42161: 'Arbitrum One',
    421613: 'Arbitrum Goerli'
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {networkInfo && (
        <Text type="secondary">
          当前网络: Chain ID {networkInfo.chainId} ({networkInfo.networkType})
        </Text>
      )}
      
      <Form
        form={form}
        layout="vertical"
        style={{ marginBottom: 16 }}
        initialValues={{ searchValue }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Form.Item
            name="searchValue"
            rules={[{ required: true, message: '请输入要查询的值' }]}
          >
            <Input
              placeholder="输入区块号、区块哈希或交易哈希"
              allowClear
              style={{ width: '100%' }}
              onPressEnter={getInfo}
              onChange={(e) => setSearchValue(e.target.value.trim())}
            />
          </Form.Item>

          <Button
            type="primary"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={getInfo}
            block
          >
            查询
          </Button>
        </Space>
      </Form>

      {blockInfo && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="区块信息">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="区块号">
                {blockInfo.number}
              </Descriptions.Item>
              <Descriptions.Item label="区块哈希">
                {blockInfo.hash}
              </Descriptions.Item>
              <Descriptions.Item label="父区块哈希">
                {blockInfo.parentHash}
              </Descriptions.Item>
              <Descriptions.Item label="区块时间">
                {formatBlockTime(blockInfo.timestamp)}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({getBlockAge(blockInfo.timestamp)})
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="矿工/验证者">
                {formatAddress(blockInfo.miner)}
              </Descriptions.Item>
              <Descriptions.Item label="Gas上限">
                {blockInfo.gasLimit}
              </Descriptions.Item>
              <Descriptions.Item label="Gas使用量">
                {blockInfo.gasUsed}
              </Descriptions.Item>
              <Descriptions.Item label="交易数量">
                {Array.isArray(blockInfo.transactions) ? blockInfo.transactions.length : '0'}
              </Descriptions.Item>
              {blockInfo.baseFeePerGas && blockInfo.baseFeePerGas !== '0' && (
                <Descriptions.Item label="Base Fee Per Gas">
                  {web3.utils.fromWei(blockInfo.baseFeePerGas, 'gwei')} Gwei
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {Array.isArray(blockInfo.transactions) && blockInfo.transactions.length > 0 && (
            <Card title={`区块交易列表 (共 ${blockInfo.transactions.length} 笔)`}>
              <Table
                dataSource={blockInfo.transactions}
                columns={[
                  {
                    title: '交易哈希',
                    dataIndex: 'hash',
                    key: 'hash',
                    render: hash => (
                      <Button 
                        type="link" 
                        onClick={() => {
                          setSearchValue(hash);
                          form.setFieldsValue({ searchValue: hash });
                          getInfo();
                        }}
                      >
                        {formatAddress(hash)}
                      </Button>
                    )
                  },
                  {
                    title: '发送方',
                    dataIndex: 'from',
                    key: 'from',
                    render: from => from ? formatAddress(from) : '-'
                  },
                  {
                    title: '接收方',
                    dataIndex: 'to',
                    key: 'to',
                    render: to => to ? formatAddress(to) : '-'
                  },
                  {
                    title: '金额 (ETH)',
                    dataIndex: 'value',
                    key: 'value',
                    render: value => value ? Number(web3.utils.fromWei(value, 'ether')).toFixed(6) : '-'
                  },
                  {
                    title: 'Gas Price (Gwei)',
                    dataIndex: 'gasPrice',
                    key: 'gasPrice',
                    render: gasPrice => gasPrice ? Number(web3.utils.fromWei(gasPrice, 'gwei')).toFixed(2) : '-'
                  },
                  {
                    title: 'Gas Limit',
                    dataIndex: 'gas',
                    key: 'gas',
                    render: gas => gas || '-'
                  }
                ]}
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            </Card>
          )}
        </Space>
      )}

      {txInfo && (
        <Card title="交易信息">
          <Descriptions bordered column={1}>
            <Descriptions.Item label="交易哈希">
              {txInfo.hash}
            </Descriptions.Item>
            <Descriptions.Item label="区块号">
              {txInfo.blockNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="区块哈希">
              {txInfo.blockHash}
            </Descriptions.Item>
            <Descriptions.Item label="交易时间">
              {formatBlockTime(txInfo.timestamp)}
              <Text type="secondary" style={{ marginLeft: 8 }}>
                ({getBlockAge(txInfo.timestamp)})
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="交易索引">
              {txInfo.transactionIndex || '0'}
            </Descriptions.Item>
            <Descriptions.Item label="发送方">
              {formatAddress(txInfo.from)}
            </Descriptions.Item>
            <Descriptions.Item label="接收方">
              {formatAddress(txInfo.to)}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              {web3.utils.fromWei(txInfo.value.toString(), 'ether')} ETH
            </Descriptions.Item>
            <Descriptions.Item label="Gas Price">
              {web3.utils.fromWei(txInfo.gasPrice.toString(), 'gwei')} Gwei
            </Descriptions.Item>
            <Descriptions.Item label="Gas Limit">
              {txInfo.gas}
            </Descriptions.Item>
            <Descriptions.Item label="Gas Used">
              {txInfo.gasUsed || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="累计 Gas Used">
              {txInfo.cumulativeGasUsed || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际 Gas 费用">
              {txInfo.gasUsed && txInfo.gasPrice ? 
                `${web3.utils.fromWei((BigInt(txInfo.gasUsed) * BigInt(txInfo.gasPrice)).toString(), 'ether')} ETH` 
                : '-'
              }
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Text type={txInfo.status === '成功' ? 'success' : 'danger'}>
                {txInfo.status || '处理中'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="交易类型">
              {(() => {
                switch (txInfo.type) {
                  case '0': return 'Legacy';
                  case '1': return 'EIP-2930';
                  case '2': return 'EIP-1559';
                  default: return txInfo.type;
                }
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Nonce">
              {txInfo.nonce}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};

export default BlockExplorer; 