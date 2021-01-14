<template>
  <Bar :context.sync="context" @update="updateContext" @updateAppList="updateAppList"></Bar>
  <div class="main">
    <div class="left">
      <Side :context="context" @update="updateContext" @updateAppList="updateAppList" v-if="context!==null"></Side>
    </div>
    <div class="right">
      <Main v-if="context===null || context.type==='license'" :context="context" @updateAppList="updateAppList"></Main>
      <User v-if="context!==null && context.type==='user'" :context="context"></User>
    </div>
  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
import Bar from './components/Bar.vue'
import Side from './components/Side.vue'
import Main from './components/Main.vue'
import User from './components/User.vue'

import { defineProps, ref, getCurrentInstance } from 'vue'
import { host } from './util.js'

const context = ref(null)
const updateContext = (newContext) => {
  context.value = newContext
}

const updateAppList = async (type) => {
  const rp = await axios.get(host() + '/api/app', {
    headers: { 'Authorization': context.value.authHeader }
  })
  context.value.appList = rp.data
  if (type) {
    context.value.type = type
  }
}
</script>

<style>
#app {
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 0;
  font-size: 14px;
}

.main {
  display: flex;
  flex-direction: row;
}

.left {
  min-height: calc(100vh - 40px);
  width: 300px;
  border-right: #6c757d 2px solid;
}

.right {
  min-height: calc(100vh - 40px);
  width: calc(100vw - 300px)
}

</style>