<template>
  <div>
    <ul class="list-group">
        <li class="list-group-item title">Users</li>
        <li class="list-group-item item" @click="switchToUser">View All Users</li>
    </ul>
    <br><br><br>
    <ul class="list-group">
        <li class="list-group-item title">Apps (<Link :disabled="context.user.readonly===1" @click="createApp">create</Link>)</li>
        <li v-for="(app,i) in apps" :key="i" class="list-group-item item" @click="switchToApp(app)">{{ app.name }}</li>
    </ul>
  </div>
</template>

<script setup>
import { defineProps, ref, defineEmit, onMounted, watchEffect } from 'vue'
import { host } from '../util.js'
import Link from './Link.vue'

const props = defineProps({
  context: Object
})

const apps = ref([])

const emit = defineEmit(["update", "updateAppList"])

const switchToUser = () => {
    props.context.type = "user"
    emit("update", props.context)
}

const switchToApp = (app) => {
    props.context.type = "license"
    props.context.appId = app.id
    emit("update", props.context)
}

watchEffect(() => {
  apps.value = props.context.appList
})

const createApp = async () => {
  const name = prompt("Please input app name")
  await axios.post(host() + '/api/app', {
    name: name
  }, {
    headers: { 'Authorization': props.context.authHeader }
  })
  emit("updateAppList")
}

</script>

<style scoped>
li.title {
  font-size: 12px;
  height: 25px;
  padding: 0;
  line-height: 25px;
  background-color: #FCFCFC;
  border: #FCFCFC 3px solid !important;
  margin-top: 0px !important;
  font-weight: bold;
}

li.item {
  border-right: none;
  border: #8c92a4 2px solid;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom-width: 1px !important;
  border-radius: 0 !important;
  margin-top: 1px;
  cursor: pointer;
}

li.item:hover {
  background-color: #F2F2F2;
}
</style>