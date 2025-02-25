import React, { useState, useEffect } from 'react'
import { Layout, Button, message, Space, Typography, Tabs, Row, Col, Card, Spin } from 'antd'
import { WalletOutlined, GithubOutlined, SafetyOutlined, SwapOutlined, HistoryOutlined, BlockOutlined, KeyOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import Web3 from 'web3'
import BatchTransfer from './components/BatchTransfer'
import TransactionHistory from './components/TransactionHistory'
import AddressGenerator from './components/AddressGenerator'
import BlockExplorer from './components/BlockExplorer'
import Swap from './components/Swap'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography

const App = () => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState('0')
  const [cryptoPrices, setCryptoPrices] = useState([])
  const [loadingPrices, setLoadingPrices] = useState(true)

  // 检查钱包是否已连接
  useEffect(() => {
    checkWalletConnection()
    fetchCryptoPrices()
    
    // 设置定时器，每60秒更新一次价格
    const priceInterval = setInterval(() => {
      fetchCryptoPrices()
    }, 60000)
    
    return () => clearInterval(priceInterval)
  }, [])

  // 获取加密货币价格
  const fetchCryptoPrices = async () => {
    try {
      setLoadingPrices(true)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,ripple,cardano,solana,polkadot&vs_currencies=usd&include_24hr_change=true')
      const data = await response.json()
      
      const formattedData = [
        {
          name: 'Bitcoin',
          symbol: 'BTC',
          price: data.bitcoin.usd,
          change: data.bitcoin.usd_24h_change,
          color: '#F7931A'
        },
        {
          name: 'Ethereum',
          symbol: 'ETH',
          price: data.ethereum.usd,
          change: data.ethereum.usd_24h_change,
          color: '#627EEA'
        },
        {
          name: 'Binance Coin',
          symbol: 'BNB',
          price: data.binancecoin.usd,
          change: data.binancecoin.usd_24h_change,
          color: '#F3BA2F'
        },
        {
          name: 'Ripple',
          symbol: 'XRP',
          price: data.ripple.usd,
          change: data.ripple.usd_24h_change,
          color: '#23292F'
        },
        {
          name: 'Cardano',
          symbol: 'ADA',
          price: data.cardano.usd,
          change: data.cardano.usd_24h_change,
          color: '#3CC8C8'
        },
        {
          name: 'Solana',
          symbol: 'SOL',
          price: data.solana.usd,
          change: data.solana.usd_24h_change,
          color: '#00FFA3'
        },
        {
          name: 'Polkadot',
          symbol: 'DOT',
          price: data.polkadot.usd,
          change: data.polkadot.usd_24h_change,
          color: '#E6007A'
        }
      ]
      
      setCryptoPrices(formattedData)
      setLoadingPrices(false)
    } catch (error) {
      console.error('获取加密货币价格失败:', error)
      setLoadingPrices(false)
      message.error('获取加密货币价格失败')
    }
  }

  // 检查钱包连接状态
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      console.log('Web3实例已创建');

      try {
        // 获取已连接的账户
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const balance = await web3Instance.eth.getBalance(accounts[0]);
          setBalance(web3Instance.utils.fromWei(balance, 'ether'));
          console.log('钱包已连接，账户:', accounts[0]);
        }
      } catch (error) {
        console.error('检查钱包连接状态失败:', error);
      }
    } else if (window.okxwallet) {
      const web3Instance = new Web3(window.okxwallet);
      setWeb3(web3Instance);
      console.log('OKX Web3实例已创建');

      try {
        const accounts = await window.okxwallet.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const balance = await web3Instance.eth.getBalance(accounts[0]);
          setBalance(web3Instance.utils.fromWei(balance, 'ether'));
          console.log('OKX钱包已连接，账户:', accounts[0]);
        }
      } catch (error) {
        console.error('检查OKX钱包连接状态失败:', error);
      }
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 创建新的web3实例
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        // 请求用户连接钱包
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])

        // 使用新创建的web3实例获取余额
        const balance = await web3Instance.eth.getBalance(accounts[0])
        setBalance(web3Instance.utils.fromWei(balance, 'ether'))
        message.success('钱包连接成功')
      } catch (error) {
        console.error('Error connecting wallet:', error)
        message.error('钱包连接失败')
      }
    } else if (window.okxwallet) {
      try {
        const web3Instance = new Web3(window.okxwallet)
        setWeb3(web3Instance)

        const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' })
        setAccount(accounts[0])
        const balance = await web3Instance.eth.getBalance(accounts[0])
        setBalance(web3Instance.utils.fromWei(balance, 'ether'))
        message.success('OKX钱包连接成功')
      } catch (error) {
        console.error('Error connecting OKX wallet:', error)
        message.error('OKX钱包连接失败')
      }
    } else {
      message.error('请安装MetaMask或OKX钱包')
    }
  }

  // 退出钱包
  const disconnectWallet = () => {
    setWeb3(null);
    setAccount('');
    setBalance('0');
    message.success('已退出钱包');
  };
  
  // 功能卡片数据
  const featureCards = [
    {
      title: '地址生成',
      icon: <KeyOutlined style={{ fontSize: '40px', color: '#1890ff' }} />,
      description: '批量生成以太坊地址和私钥，支持导出为Excel格式',
      color: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
      borderColor: '#69c0ff',
      shadowColor: 'rgba(24, 144, 255, 0.2)'
    },
    {
      title: '批量转账',
      icon: <SafetyOutlined style={{ fontSize: '40px', color: '#52c41a' }} />,
      description: '一次性向多个地址发送ETH或代币，提高转账效率',
      color: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
      borderColor: '#95de64',
      shadowColor: 'rgba(82, 196, 26, 0.2)'
    },
    {
      title: '交易记录',
      icon: <HistoryOutlined style={{ fontSize: '40px', color: '#faad14' }} />,
      description: '查询任意地址的历史交易记录，支持筛选和导出',
      color: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
      borderColor: '#ffd666',
      shadowColor: 'rgba(250, 173, 20, 0.2)'
    },
    {
      title: '区块查询',
      icon: <BlockOutlined style={{ fontSize: '40px', color: '#722ed1' }} />,
      description: '浏览区块链数据，查看区块详情和交易信息',
      color: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
      borderColor: '#b37feb',
      shadowColor: 'rgba(114, 46, 209, 0.2)'
    },
    {
      title: '代币兑换',
      icon: <SwapOutlined style={{ fontSize: '40px', color: '#eb2f96' }} />,
      description: '便捷地在不同代币之间进行兑换，支持多种DEX',
      color: 'linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)',
      borderColor: '#ff85c0',
      shadowColor: 'rgba(235, 47, 150, 0.2)'
    }
  ];
  
  // 价格滚动组件
  const PriceMarquee = () => {
    return (
      <div style={{ 
        width: '100%', 
        background: '#001529',
        padding: '6px 0',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {loadingPrices ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 0' }}>
            <Spin size="small" />
            <span style={{ color: 'rgba(255,255,255,0.85)', marginLeft: '10px', fontSize: '12px' }}>加载价格数据...</span>
          </div>
        ) : (
          <div style={{ 
            display: 'flex',
            animation: 'marquee 30s linear infinite',
            whiteSpace: 'nowrap'
          }}>
            {cryptoPrices.map((crypto, index) => (
              <div key={index} style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                margin: '0 20px',
                padding: '2px 0'
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: crypto.color,
                  marginRight: '6px'
                }}></span>
                <span style={{ color: 'rgba(255,255,255,0.85)', marginRight: '6px', fontSize: '12px' }}>
                  {crypto.symbol}
                </span>
                <span style={{ color: 'white', fontWeight: 'bold', marginRight: '6px', fontSize: '12px' }}>
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ 
                  color: crypto.change >= 0 ? '#52c41a' : '#ff4d4f',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {crypto.change >= 0 ? <ArrowUpOutlined style={{ fontSize: '10px' }} /> : <ArrowDownOutlined style={{ fontSize: '10px' }} />}
                  {Math.abs(crypto.change).toFixed(2)}%
                </span>
              </div>
            ))}
            {/* 重复一次以确保连续滚动 */}
            {cryptoPrices.map((crypto, index) => (
              <div key={`repeat-${index}`} style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                margin: '0 20px',
                padding: '2px 0'
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: crypto.color,
                  marginRight: '6px'
                }}></span>
                <span style={{ color: 'rgba(255,255,255,0.85)', marginRight: '6px', fontSize: '12px' }}>
                  {crypto.symbol}
                </span>
                <span style={{ color: 'white', fontWeight: 'bold', marginRight: '6px', fontSize: '12px' }}>
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ 
                  color: crypto.change >= 0 ? '#52c41a' : '#ff4d4f',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {crypto.change >= 0 ? <ArrowUpOutlined style={{ fontSize: '10px' }} /> : <ArrowDownOutlined style={{ fontSize: '10px' }} />}
                  {Math.abs(crypto.change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', // 使用固定高度而非最小高度
      overflow: 'hidden', // 防止整体出现滚动条
      background: '#f5f8fa' // 更柔和的背景色
    }}>
      {/* 价格滚动条 */}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
      <PriceMarquee />
      
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '100%',
        height: '64px', // 固定Header高度
        flexShrink: 0, // 防止Header被压缩
        background: 'linear-gradient(90deg, #001529 0%, #003a70 100%)', // 渐变背景
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' // 添加阴影
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <WalletOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '10px' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Web3工具箱</Title>
        </div>
        <Space>
          {account ? (
            <>
              <div 
                style={{ 
                  backgroundColor: 'rgba(24, 144, 255, 0.2)', 
                  padding: '4px 12px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid rgba(24, 144, 255, 0.5)'
                }}
              >
                <Text 
                  style={{ 
                    color: '#fff', 
                    margin: 0,
                    fontWeight: 'bold'
                  }}
                >
                  {parseFloat(balance).toFixed(4)} ETH
                </Text>
              </div>
              <Button
                type="primary"
                icon={<WalletOutlined />}
                style={{
                  background: '#1890ff',
                  borderColor: '#1890ff'
                }}
              >
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </Button>
              <Button
                onClick={disconnectWallet}
                danger
                style={{
                  background: 'rgba(255, 77, 79, 0.1)',
                  borderColor: '#ff4d4f',
                  color: '#ff4d4f'
                }}
              >
                退出钱包
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<WalletOutlined />}
              onClick={connectWallet}
              style={{
                background: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              连接钱包
            </Button>
          )}
        </Space>
      </Header>
      
      <div style={{ 
        flex: '1 0 auto',
        padding: '0', 
        background: '#f0f2f5',
        overflowY: 'auto',
        overflowX: 'hidden',
        height: 'calc(100vh - 114px - 30px)' // 减去Header、Footer和价格条的高度
      }}>
        {account ? (
          <div style={{ padding: '24px' }}>
            <Card 
              style={{ 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                marginBottom: '24px'
              }}
            >
              <Tabs 
                defaultActiveKey="1" 
                items={[
                   {
                    key: '1',
                    label: 'EVM地址生成',
                    children: <AddressGenerator web3={web3} />
                  },
                  // {
                  //   key: '2',
                  //   label: '批量转账',
                  //   children: <BatchTransfer web3={web3} account={account} />
                  // },
                  // {
                  //   key: '3',
                  //   label: '交易记录',
                  //   children: <TransactionHistory web3={web3} account={account} />
                  // },
               
                  // {
                  //   key: '4',
                  //   label: '区块查询',
                  //   children: <BlockExplorer web3={web3} />
                  // },
                  // {
                  //   key: '5',
                  //   label: '代币兑换',
                  //   children: <Swap web3={web3} account={account} />
                  // }
                ]} 
              />
            </Card>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            height: '100%',
            padding: '24px 24px 50px' // 底部增加padding，为footer腾出空间
          }}>
            {/* 欢迎横幅 */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
              padding: '40px 30px',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 21, 41, 0.12)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '30px'
            }}>
              {/* 装饰性背景元素 */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '10%',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                zIndex: 0
              }}></div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Title level={1} style={{ 
                  color: 'white', 
                  marginBottom: '20px', 
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: '38px',
                  fontWeight: '600',
                  letterSpacing: '1px'
                }}>
                  Web3 工具箱
                </Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontSize: '18px', 
                  maxWidth: '700px', 
                  margin: '0 auto 30px',
                  lineHeight: '1.6',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  一站式区块链工具集合，助您轻松管理资产、执行交易和探索区块链数据
                </Paragraph>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<WalletOutlined />} 
                  onClick={connectWallet}
                  style={{ 
                    height: '50px',
                    padding: '0 35px',
                    fontSize: '18px',
                    background: 'white',
                    color: '#1890ff',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    borderRadius: '25px',
                    fontWeight: '500'
                  }}
                >
                  连接钱包开始使用
                </Button>
              </div>
            </div>
            
            {/* 功能卡片 */}
            <div style={{ 
              width: '100%', 
              flex: '1 0 auto', // 允许伸缩以填充空间
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Title level={2} style={{ 
                textAlign: 'center', 
                marginBottom: '30px',
                fontSize: '28px',
                fontWeight: '600',
                color: '#262626'
              }}>
                功能一览
              </Title>
              <Row 
                gutter={[24, 24]} 
                justify="center"
                style={{ 
                  flex: '1 0 auto', // 允许伸缩以填充空间
                  alignItems: 'stretch' // 确保所有列等高
                }}
              >
                {featureCards.map((feature, index) => (
                  <Col xs={24} sm={12} lg={8} xl={4} key={index} style={{ display: 'flex' }}>
                    <div 
                      style={{ 
                        flex: '1 0 auto', // 填充整个Col空间
                        background: feature.color,
                        borderRadius: '16px',
                        padding: '25px 20px',
                        textAlign: 'center',
                        border: `1px solid ${feature.borderColor}`,
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                        boxShadow: `0 4px 16px ${feature.shadowColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = `0 12px 24px ${feature.shadowColor}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 16px ${feature.shadowColor}`;
                      }}
                    >
                      <div style={{ 
                        marginBottom: '16px',
                        width: '70px',
                        height: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        borderRadius: '50%',
                        boxShadow: `0 8px 20px ${feature.shadowColor}`
                      }}>
                        {feature.icon}
                      </div>
                      <Title level={3} style={{ 
                        marginBottom: '12px', 
                        fontSize: '20px',
                        color: '#262626',
                        fontWeight: '600'
                      }}>
                        {feature.title}
                      </Title>
                      <Paragraph style={{ 
                        color: 'rgba(0, 0, 0, 0.65)', 
                        fontSize: '14px', 
                        marginBottom: 0,
                        lineHeight: '1.6'
                      }}>
                        {feature.description}
                      </Paragraph>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </div>
      
      {/* 使用固定定位的页脚 */}
      <div style={{ 
        position: 'fixed',
        left: 0,
        bottom: 0,
        width: '100%',
        background: 'white',
        textAlign: 'center',
        padding: '14px 50px',
        borderTop: '1px solid #e8e8e8',
        zIndex: 10,
        flexShrink: 0, // 防止Footer被压缩
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
        height: '50px' // 固定Footer高度
      }}>
        <Text>Web3工具箱 ©2025 Created by MarshalT</Text>
        <span style={{ margin: '0 8px' }}>|</span>
        <a 
          href="https://github.com/MarshalT/web3" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#1890ff' }}
        >
          <GithubOutlined style={{ fontSize: '16px', marginRight: '4px' }} />
          <span>GitHub 仓库</span>
        </a>
      </div>
    </div>
  )
}

export default App