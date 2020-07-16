/*
 * @author: 风魔小次郎
 * @Date: 2020-07-16 22:39:09
 * @desc: 开发模式下，对某一个包或所有包的文件进行(伪)热更新
 */
const inquirer = require('inquirer')
const fs = require('fs')
const path = require('path')
const c = require('ansi-colors')
const WatchPack = require('watchpack')
const { spawn } = require('child_process')

const resolve = (...args) => path.resolve.apply(null, [process.cwd(), ...args])

console.log(c.green('searching packages'))

// 包路径
const packagesPath = resolve('packages')
// 获取包列表
const filelist = fs.readdirSync(packagesPath).filter(file => /^[^.]/.test(file))
filelist.unshift('All*')
const questions = [
  {
    type: 'list',
    name: 'package',
    message: '选择要开发的包',
    choices: filelist
  }
]

if (filelist.length === 0) {
  console.log(`${c.bgRed('Wrong')}${c.red('开发目录为空，请检查' + packagesPath + '中的内容')}`)
  process.exit(1)
}

inquirer.prompt(questions).then(ans => {
  const pack = ans.package
  const dirList = [ resolve(packagesPath, pack === 'All*' ? '' : pack) ]
  Listen(dirList)
})
function Listen (dirList) {
  let onListenDir = []

  let isCompiling = false

  const wp = new WatchPack({
    aggregateTimeout: 500, // 文件改动500ms后发起动作
    poll: true, // 默认轮询速度
    ignored: /node_modules/
  })
  wp.watch([], dirList)
  wp.on('change', function (filePath, mtime, explanation) {
    if (onListenDir.length === 0 || isCompiling) return
    console.log(`${c.bgGreen(c.black('监听到文件改动'))} ${filePath} ${c.green('重新编译')}`)
    isCompiling = true
    // const compiler = exec('cd ./packages/nerv && rollup -c')
    const compiler = spawn('rollup', [ '-c' ], {
      cwd: dirList[0]
    })
    compiler.stdout.on('data', data => {
      console.log('data', data)
    })
    compiler.on('close', data => {
      isCompiling = false
      console.log(`${c.bgGreen(c.black('编译完成'))}`)
    })
  })
  wp.on('aggregated', function (changes, removals) {
    // changes: a Set of all changed files
    // removals: a Set of all removed files
    // watchpack gives up ownership on these Sets.
    if (onListenDir.length === 0) {
      onListenDir = [...changes]
      console.log(`${c.bgGreen(c.black('初始化完成'))}   ${c.green('开始监听文件改动')}`)
    }
  })
}
