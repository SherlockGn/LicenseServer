<template>
  <div class="bar bg-primary">
    <div>Current User: <span>{{context===null?'NaN':context.user.name}}</span></div>
    <div style="margin-right: 20px;">
      <div v-if="context!==null">
        <button class="bar-action btn btn-light" @click="logOut">Log out</button>
      </div>
      <div v-else>
        <button class="bar-action btn btn-light" @click="logIn">Log In</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { defineProps, reactive, defineEmit } from 'vue'
  import { sha1, guid, host } from "../util.js"

  defineProps({
    context: Object
  })

  const emit = defineEmit(["update", "updateAppList"])

  const logIn = async () => {
    const salt = guid()
    const name = prompt('Please input user name')
    const plainPassword = prompt('Please input user password')
    const p1 = sha1(name + "|" + plainPassword)
    const p2 = sha1(p1 + "|" + salt)
    const authHeader = JSON.stringify({
      name: name,
      salt: salt,
      password: p2
    })
    const rp = await axios.get(host() + '/api/user/check', {
      headers: { 'Authorization': authHeader }
    })
    const user = rp.data
    if (user === null) {
      alert("Incorrect username or password.")
    } else {
      await axios.get(host() + '/api/user/check', {
        headers: { 'Authorization': authHeader }
      })
      const rp = await axios.get(host() + '/api/app', {
        headers: { 'Authorization': authHeader }
      })
      emit("update", {
        user: user,
        appId: null,
        appList: rp.data,
        type: 'user',
        authHeader: authHeader
      })
    }
  }
  const logOut = () => {
    emit("update", null)
  }
</script>

<style scoped>
.bar {
  width: 100%;
  height: 40px;
  margin: 0;
  line-height: 40px;
  text-align: left;
  color: white;
  padding-left: 30px;
  font-size: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.bar-action {
  height: 20px;
  width: 80px;
  font-size: 12px;
  padding: 0;
  margin-left: 10px;
}
</style>