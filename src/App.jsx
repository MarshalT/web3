import React, { useState, useEffect } from 'react'
import { Layout, Button, message, Space, Typography, Tabs } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import Web3 from 'web3'
import BatchTransfer from './components/BatchTransfer'
import TransactionHistory from './components/TransactionHistory'
import AddressGenerator from './components/AddressGenerator'
import BlockExplorer from './components/BlockExplorer'
import Swap from './components/Swap'

const { Header, Content } = Layout
const { Title } = Typography

const App = () => {
  const [web3, setWeb3] = useState(null)
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState('0')

  // 检查钱包是否已连接
  useEffect(() => {
    checkWalletConnection()
  }, [])

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
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>Web3工具箱</Title>
        <Space>
          {account ? (
            <>
              <Button
                type="primary"
                icon={<WalletOutlined />}
              >
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </Button>
              <Button
                onClick={disconnectWallet}
                danger
              >
                退出钱包
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<WalletOutlined />}
              onClick={connectWallet}
            >
              连接钱包
            </Button>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#fff' }}>
        {account && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Typography.Text strong>当前账户余额: {parseFloat(balance).toFixed(4)} ETH</Typography.Text>
            <Tabs defaultActiveKey="1" items={[
              { key: '1',
                label: '地址生成',
                children: <AddressGenerator />              
              },
              { key: '2',
                label: '批量转账',
                children: <BatchTransfer web3={web3} account={account} />             
              },
              {
                key: '3',
                label: '交易记录',
                children: <TransactionHistory web3={web3} />
              },
              {
                key: '4',
                label: '区块查询',
                children: <BlockExplorer web3={web3} />
              },
              {
                key: '5',
                label: '代币兑换',
                children: <Swap web3={web3} account={account} />
              }
            ]} />
          </Space>
        )}
      </Content>
    </Layout>
  )
}

export default App