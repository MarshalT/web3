import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Space, Typography, Card, Divider, message, Spin } from 'antd';
import { SwapOutlined, SettingOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const Swap = ({ web3, account }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [rate, setRate] = useState(0);
  const [priceImpact, setPriceImpact] = useState(0);
  const [slippage, setSlippage] = useState(0.5); // 默认滑点容忍度 0.5%
  const [fetchingRate, setFetchingRate] = useState(false);
  const [tokens, setTokens] = useState([
    { symbol: 'ETH', name: '以太币', address: '', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
    { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png' }
  ]);

  // 模拟获取兑换率
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setFetchingRate(true);
      
      // 模拟API调用延迟
      const timer = setTimeout(() => {
        // 这里应该调用实际的 API 获取兑换率
        // 这里只是模拟一个随机的兑换率
        const mockRate = Math.random() * 1000;
        setRate(mockRate);
        setToAmount((parseFloat(fromAmount) * mockRate).toFixed(6));
        
        // 模拟价格影响
        setPriceImpact((Math.random() * 2).toFixed(2));
        setFetchingRate(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setToAmount('');
      setRate(0);
      setPriceImpact(0);
    }
  }, [fromToken, toToken, fromAmount]);

  // 交换代币
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    form.setFieldsValue({
      fromToken: toToken,
      toToken: fromToken
    });
  };

  // 执行兑换
  const handleSwap = async () => {
    if (!web3 || !account) {
      message.error('请先连接钱包');
      return;
    }

    if (!fromToken || !toToken || !fromAmount) {
      message.error('请填写完整的兑换信息');
      return;
    }

    setLoading(true);
    try {
      // 这里应该实现实际的兑换逻辑
      // 例如调用 Uniswap 或其他 DEX 的合约
      
      // 模拟兑换过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('兑换成功');
      form.resetFields();
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('兑换失败:', error);
      message.error(error.message || '兑换失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取代币信息
  const getTokenInfo = (symbol) => {
    return tokens.find(t => t.symbol === symbol) || {};
  };

  // 计算最小获得数量（考虑滑点）
  const getMinimumReceived = () => {
    if (!toAmount || !slippage) return '0';
    const amount = parseFloat(toAmount);
    return (amount * (1 - slippage / 100)).toFixed(6);
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px' }}>
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          background: '#f7f8fa'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Text strong style={{ fontSize: '18px' }}>兑换</Text>
          <Button 
            type="text" 
            icon={<SettingOutlined />} 
            style={{ border: 'none', background: 'transparent' }}
          />
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSwap}
          initialValues={{ fromToken: 'ETH' }}
        >
          {/* 源代币输入框 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '16px', 
            marginBottom: '8px',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text type="secondary">从</Text>
              {account && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  余额: {/* 这里应该显示实际余额 */}0.00
                </Text>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Input
                placeholder="0.0"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value.trim())}
                style={{ 
                  border: 'none', 
                  fontSize: '24px', 
                  padding: '0',
                  width: '60%',
                  background: 'transparent'
                }}
                autoComplete="on"
                name="from-amount"
              />
              
              <Select
                value={fromToken}
                onChange={value => setFromToken(value)}
                style={{ width: '40%', fontSize: '16px' }}
                dropdownStyle={{ borderRadius: '12px' }}
                optionLabelProp="label"
              >
                {tokens.map(token => (
                  <Option 
                    key={token.symbol} 
                    value={token.symbol}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src={token.logo} 
                          alt={token.symbol} 
                          style={{ width: 24, height: 24, marginRight: 8 }} 
                        />
                        {token.symbol}
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={token.logo} 
                        alt={token.symbol} 
                        style={{ width: 24, height: 24, marginRight: 8 }} 
                      />
                      <div>
                        <div>{token.symbol}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{token.name}</div>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
          
          {/* 交换按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0', zIndex: 2, position: 'relative' }}>
            <Button 
              type="primary" 
              shape="circle" 
              icon={<ArrowDownOutlined />} 
              onClick={handleSwapTokens}
              style={{ 
                background: '#fff', 
                borderColor: '#e8e8e8', 
                color: '#1890ff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              size="middle"
            />
          </div>
          
          {/* 目标代币输入框 */}
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text type="secondary">到</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '60%', fontSize: '24px', position: 'relative' }}>
                {fetchingRate ? (
                  <Spin size="small" style={{ marginRight: 8 }} />
                ) : (
                  <Input
                    placeholder="0.0"
                    value={toAmount}
                    disabled
                    style={{ 
                      border: 'none', 
                      fontSize: '24px', 
                      padding: '0',
                      width: '100%',
                      background: 'transparent'
                    }}
                  />
                )}
              </div>
              
              <Select
                value={toToken}
                onChange={value => setToToken(value)}
                style={{ width: '40%', fontSize: '16px' }}
                dropdownStyle={{ borderRadius: '12px' }}
                placeholder="选择代币"
                optionLabelProp="label"
              >
                {tokens.map(token => (
                  <Option 
                    key={token.symbol} 
                    value={token.symbol}
                    disabled={token.symbol === fromToken}
                    label={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                          src={token.logo} 
                          alt={token.symbol} 
                          style={{ width: 24, height: 24, marginRight: 8 }} 
                        />
                        {token.symbol}
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img 
                        src={token.logo} 
                        alt={token.symbol} 
                        style={{ width: 24, height: 24, marginRight: 8 }} 
                      />
                      <div>
                        <div>{token.symbol}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{token.name}</div>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
          
          {/* 交易详情 */}
          {rate > 0 && (
            <div style={{ 
              background: '#fff', 
              borderRadius: '12px', 
              padding: '12px 16px',
              marginBottom: '16px',
              border: '1px solid #e8e8e8'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text type="secondary">兑换比率</Text>
                <Text>1 {fromToken} = {rate.toFixed(6)} {toToken}</Text>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text type="secondary">最小获得</Text>
                <Text>{getMinimumReceived()} {toToken}</Text>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">价格影响</Text>
                <Text style={{ color: parseFloat(priceImpact) > 1 ? '#ff4d4f' : '#52c41a' }}>
                  {priceImpact}%
                </Text>
              </div>
            </div>
          )}
          
          {/* 兑换按钮 */}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!fromToken || !toToken || !fromAmount || !toAmount}
            block
            size="large"
            style={{ 
              height: '56px', 
              borderRadius: '12px', 
              fontSize: '18px',
              background: (!fromToken || !toToken || !fromAmount || !toAmount) ? '#e8e8e8' : '#1890ff'
            }}
          >
            {!account ? '请先连接钱包' : 
             !fromToken || !toToken ? '选择代币' :
             !fromAmount ? '输入金额' : '兑换'}
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Swap; 