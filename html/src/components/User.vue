<template>
  <div v-if="context!==null">
  <table class="table table-striped table-hover">
    <caption style="caption-side: top; text-align: center;">Users</caption>
    <thead>
      <tr>
        <th>Username</th>
        <th>Password</th>
        <th>Readonly</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(u,i) in users" :key="i">
        <td>{{ u.name }}</td>
        <td>
          <Link :disabled="context.user.readonly===1 && u.id!==context.user.id" @click="changePassword(u)">change</Link>
        </td>
        <td>
          <input class="form-check-input"
          type="checkbox"
          v-model="u.readonly"
          @change="changeReadonly(u)"
          :disabled="context.user.readonly===1 || u.id===context.user.id">
        </td>
      </tr>
    </tbody>
  </table>
  <button class="btn btn-success btn-sm" @click="createUser" :disabled="context.user.readonly">Create a User</button>
  </div>
</template>

<script setup>
import { defineProps, computed, ref, onMounted } from 'vue'
import Link from './Link.vue'
import { guid, host } from '../util.js'

const props = defineProps({
  context: Object
})

const users = ref([])

onMounted(async () => {
  const rp = await axios.get(host() + '/api/user', {
    headers: { 'Authorization': props.context.authHeader }
  })
  rp.data.forEach(u => u.readonly = u.readonly === 1)
  users.value = rp.data
})

const createUser = async () => {
  const name = prompt('Please input user name')
  await axios.post(host() + '/api/user', {
    name: name,
    password: guid(),
    readonly: true,
  }, {
    headers: { 'Authorization': props.context.authHeader }
  })
  const rp = await axios.get(host() + '/api/user', {
    headers: { 'Authorization': props.context.authHeader }
  })
  users.value = rp.data
  users.value.forEach(u => u.readonly = u.readonly === 1)
}

const changePassword = async (u) => {
  const password = prompt('Please input user password')
  if (password === null) {
    return
  }
  await axios.put(host() + '/api/user', {
    id: u.id,
    name: u.name,
    password: password,
    readonly: u.readonly,
  }, {
    headers: { 'Authorization': props.context.authHeader }
  })
  const rp = await axios.get(host() + '/api/user', {
    headers: { 'Authorization': props.context.authHeader }
  })
  users.value = rp.data
  users.value.forEach(u => u.readonly = u.readonly === 1)
}

const changeReadonly = async (u) => {
  await axios.put(host() + '/api/user', {
    id: u.id,
    name: u.name,
    password: null,
    readonly: u.readonly,
  }, {
    headers: { 'Authorization': props.context.authHeader }
  })
  const rp = await axios.get(host() + '/api/user', {
    headers: { 'Authorization': props.context.authHeader }
  })
  users.value = rp.data
  users.value.forEach(u => u.readonly = u.readonly === 1)
}

</script>

<style scoped>

table {
}

td, th {
  white-space: nowrap 
}

button {
  font-size: 12px;
}

</style>