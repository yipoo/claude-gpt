#!/usr/bin/env node
// 运行方式: node scripts/refresh-token.js [--refreshToken=你的刷新令牌]

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
const argv = yargs(hideBin(process.argv))
  .option('refreshToken', {
    type: 'string',
    description: '刷新令牌',
  })
  .option('host', {
    type: 'string',
    description: '服务器地址',
    default: 'http://localhost:3000'
  })
  .option('save', {
    type: 'boolean',
    description: '保存令牌到文件',
    default: true
  })
  .help()
  .alias('help', 'h')
  .argv;

async function refreshToken() {
  try {
    let { refreshToken, host, save } = argv;
    
    // 如果没有提供刷新令牌，尝试从文件中读取
    if (!refreshToken) {
      const tokenFilePath = path.join(__dirname, 'token.json');
      if (fs.existsSync(tokenFilePath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
        refreshToken = tokenData.refreshToken;
        console.log('已从文件中读取刷新令牌');
      } else {
        console.error('错误: 未提供刷新令牌，且找不到令牌文件');
        process.exit(1);
      }
    }
    
    console.log('正在刷新访问令牌...');
    
    const response = await axios.post(`${host}/api/v1/auth/refresh-token`, {
      refreshToken
    });
    
    const { token, refreshToken: newRefreshToken } = response.data.data;
    
    console.log('\n令牌刷新成功!');
    
    if (save) {
      // 从文件中读取现有数据
      const tokenFilePath = path.join(__dirname, 'token.json');
      let tokenData = {};
      
      if (fs.existsSync(tokenFilePath)) {
        tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      }
      
      // 更新令牌信息
      tokenData.token = token;
      tokenData.refreshToken = newRefreshToken;
      tokenData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 假设令牌有效期为24小时
      
      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
      console.log(`\n新令牌已保存到: ${tokenFilePath}`);
    } else {
      console.log('\n新访问令牌:');
      console.log(token);
      console.log('\n新刷新令牌:');
      console.log(newRefreshToken);
    }
    
    return response.data;
  } catch (error) {
    console.error('\n令牌刷新失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error('错误信息:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

refreshToken();
