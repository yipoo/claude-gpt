#!/usr/bin/env node
// 运行方式: node scripts/login.js --email=user@example.com --password=yourpassword

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
const argv = yargs(hideBin(process.argv))
  .option('email', {
    type: 'string',
    description: '用户邮箱',
    demandOption: true
  })
  .option('password', {
    type: 'string',
    description: '用户密码',
    demandOption: true
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

async function loginUser() {
  try {
    const { email, password, host, save } = argv;
    
    console.log('正在登录...');
    console.log(`邮箱: ${email}`);
    
    const response = await axios.post(`${host}/api/v1/auth/login`, {
      email,
      password
    });
    
    const { token, refreshToken, user } = response.data.data;
    
    console.log('\n登录成功!');
    console.log('用户信息:');
    console.log(JSON.stringify(user, null, 2));
    
    if (save) {
      // 保存令牌到文件
      const tokenData = {
        token,
        refreshToken,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 假设令牌有效期为24小时
      };
      
      const tokenFilePath = path.join(__dirname, 'token.json');
      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
      console.log(`\n令牌已保存到: ${tokenFilePath}`);
      console.log('可以在其他脚本中使用这些令牌进行API调用');
    } else {
      console.log('\n访问令牌:');
      console.log(token);
      console.log('\n刷新令牌:');
      console.log(refreshToken);
    }
    
    return response.data;
  } catch (error) {
    console.error('\n登录失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error('错误信息:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

loginUser();
