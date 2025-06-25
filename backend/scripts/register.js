#!/usr/bin/env node
// 运行方式: node scripts/register.js --email=test@test.com --password=A888888a --fullName="张三"

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

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
  .option('fullName', {
    type: 'string',
    description: '用户全名',
    demandOption: true
  })
  .option('host', {
    type: 'string',
    description: '服务器地址',
    default: 'http://localhost:3000'
  })
  .help()
  .alias('help', 'h')
  .argv;

async function registerUser() {
  try {
    const { email, password, fullName, host } = argv;
    
    console.log('正在注册用户...');
    console.log(`邮箱: ${email}`);
    console.log(`全名: ${fullName}`);
    
    const response = await axios.post(`${host}/api/v1/auth/register`, {
      email,
      password,
      fullName
    });
    
    console.log('\n注册成功!');
    console.log('用户信息:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('\n注册失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error('错误信息:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

registerUser();
