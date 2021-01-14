<template>
  <div v-if="context!==null">
  <table class="table table-striped table-hover">
    <caption style="caption-side: top; text-align: center;">{{ context.appList.find(a => a.id === context.appId).name }}</caption>
    <thead>
      <tr>
        <th>License ID</th>
        <th>Username</th>
        <th>Machine Name</th>
        <th>OS Username</th>
        <th>Available Versions</th>
        <th>Expiration</th>
        <th>Recent</th>
        <th>Activation Count</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(lic,i) in licenses" :key="i">
        <td class="id"><Link @click="changeId(lic)" :disabled="context.user.readonly===1">{{ lic.id }}</Link></td>
        <td><Link @click="changeUser(lic)" :disabled="context.user.readonly===1">{{ lic.user }}</Link></td>
        <td><Link @click="changeMachine(lic)" :disabled="context.user.readonly===1">{{ lic.machine }}</Link></td>
        <td><Link @click="changeOsUser(lic)" :disabled="context.user.readonly===1">{{ lic.os_user }}</Link></td>
        <td><Link @click="changeVersion(lic)" :disabled="context.user.readonly===1">{{ lic.version }}</Link></td>
        <td><code>{{ lic.expiration_time }}</code> (<Link @click="changeExpirationTime(lic)" :disabled="context.user.readonly===1">change</Link>)</td>
        <td><code>{{ lic.recent_activation_time }}</code></td>
        <td>{{ lic.activation_count }}</td>
        <td>
          <button class="btn btn-danger btn-sm" :disabled="context.user.readonly===1" @click="deleteLicense(lic)">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
  <button class="btn btn-success btn-sm" @click="testLicense">Test License</button>&nbsp;&nbsp;&nbsp;&nbsp;
  <button class="btn btn-warning btn-sm" @click="refreshLicense">Refresh</button>&nbsp;&nbsp;&nbsp;&nbsp;
  <button class="btn btn-success btn-sm" :disabled="context.user.readonly===1" @click="createLicense">Create a License</button>&nbsp;&nbsp;&nbsp;&nbsp;
  <button class="btn btn-danger btn-sm" :disabled="context.user.readonly===1" @click="deleteApp">Delete This App</button>
  </div>
  <div v-else style="margin-top: 70px;">
    Please log in to view the license data.
  </div>
</template>

<script setup>
import { defineProps, ref, defineEmit, onMounted, computed, watchEffect } from 'vue'
import Link from './Link.vue'
import { checkVersion, toDate, host } from '../util.js'

const props = defineProps({
  context: Object
})

const emit = defineEmit(['updateAppList'])

const licenses = ref([])

watchEffect(async () => {
  if (props.context === null) {
    licenses.value = []
    return
  }
  const appId = props.context.appId
  const rp = await axios.get(host() + '/api/license?appId=' + appId, {
    headers: { 'Authorization': props.context.authHeader }
  })
  licenses.value = rp.data
})

const createLicense = async () => {
  await axios.post(host() + '/api/license', {
    appId: props.context.appId,
    expirationTime: "9999-01-01T00:00:00.000Z",
    user: "*",
    machine: "*",
    osUser: "*",
    version: "1.0, 1.0+"
  }, {
    headers: { 'Authorization': props.context.authHeader }
  })
  const appId = props.context.appId
  const rp = await axios.get(host() + '/api/license?appId=' + appId, {
    headers: { 'Authorization': props.context.authHeader }
  })
  licenses.value = rp.data
}

const refreshLicense = async () => {
  const appId = props.context.appId
  const rp = await axios.get(host() + '/api/license?appId=' + appId, {
    headers: { 'Authorization': props.context.authHeader }
  })
  licenses.value = rp.data
}

const deleteLicense = async (lic) => {
  await axios.delete(host() + '/api/license', {
    data: { id: lic.id },
    headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const deleteApp = async (lic) => {
  await axios.delete(host() + '/api/app', {
    data: { id: props.context.appId },
    headers: { 'Authorization': props.context.authHeader }
  })
  emit("updateAppList", "user")
}

const changeId = async (lic) => {
  const value = prompt("Please input the new license ID")
  if (value === null || value === "") {
    return
  }
  try {
    await axios.put(host() + '/api/license', {
        id: lic.id,
        newId: value,
        expirationTime: lic.expiration_time,
        user: lic.user,
        machine: lic.machine,
        osUser: lic.os_user,
        version: lic.version
      }, { headers: { 'Authorization': props.context.authHeader }
    })
  } catch (e) {
    alert("The license ID already exists")
  }
  await refreshLicense()
}

const changeUser = async (lic) => {
  const value = prompt("Please input the new license user")
  if (value === null || value === "") {
    return
  }
  await axios.put(host() + '/api/license', {
      id: lic.id,
      newId: null,
      expirationTime: lic.expiration_time,
      user: value,
      machine: lic.machine,
      osUser: lic.os_user,
      version: lic.version
    }, { headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const changeMachine = async (lic) => {
  const value = prompt("Please input the new license machine")
  if (value === null || value === "") {
    return
  }
  await axios.put(host() + '/api/license', {
      id: lic.id,
      newId: null,
      expirationTime: lic.expiration_time,
      user: lic.user,
      machine: value,
      osUser: lic.os_user,
      version: lic.version
    }, { headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const changeOsUser = async (lic) => {
  const value = prompt("Please input the new license OS user")
  if (value === null || value === "") {
    return
  }
  await axios.put(host() + '/api/license', {
      id: lic.id,
      newId: null,
      expirationTime: lic.expiration_time,
      user: lic.user,
      machine: lic.machine,
      osUser: value,
      version: lic.version
    }, { headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const changeVersion = async (lic) => {
  const value = prompt("Please input the versions")
  if (value === null || value === "") {
    return
  }
  if (!checkVersion(value)) {
    alert('Bad format!')
    return
  }
  await axios.put(host() + '/api/license', {
      id: lic.id,
      newId: null,
      expirationTime: lic.expiration_time,
      user: lic.user,
      machine: lic.machine,
      osUser: lic.os_user,
      version: value.split(",").map(i => i.trim()).join(", ")
    }, { headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const changeExpirationTime = async (lic) => {
  const value = prompt("Please input the expiration time")
  if (value === null || value === "") {
    return
  }
  const dateString = toDate(value)
  if (dateString === null) {
    alert('Invalid date!')
    return
  }
  await axios.put(host() + '/api/license', {
      id: lic.id,
      newId: null,
      expirationTime: dateString,
      user: lic.user,
      machine: lic.machine,
      osUser: lic.os_user,
      version: lic.version
    }, { headers: { 'Authorization': props.context.authHeader }
  })
  await refreshLicense()
}

const testLicense = async () => {
  const value = prompt("Please input the licenseID|username|machine|osName|version")
  if (value === null) {
    return
  }
  const parts = value.split('|')
  const licenseId = parts[0]
  const user = parts[1]
  const machine = parts[2]
  const osName = parts[3]
  const version = parts[4]
  const queryParams = [
    parts[0] ? 'licenseId=' + parts[0] : '',
    parts[1] ? 'user=' + parts[1] : '',
    parts[2] ? 'machine=' + parts[2] : '',
    parts[3] ? 'osUser=' + parts[3] : '',
    parts[4] ? 'version=' + parts[4] : '',
  ]
  const queryString = queryParams.filter(p => p !== '').join('&');
  const url = host() + '/api/status' + (queryString.length > 0 ? '?' : '') + queryString
  const rp = await axios.get(url,
    { headers: { 'Authorization': props.context.authHeader } }
  )
  const w1 = rp.data.verify ? "PASSED!!!" : "FAILED!!!"
  const w2 = rp.data.app === null ? '' : rp.data.app.name
  const w3 = rp.data.status
  const text = [w1, w2, w3].filter(p => p !== '').join(', ')
  alert(text)
}


</script>

<style scoped>

td, th {
  white-space: nowrap;
}

button {
  font-size: 12px;
}

code {
    font-size: 85%;
    background-color: rgba(27,31,35,.05);
    border-radius: 3px;
    padding: 3px;
}

.id {
  font-family: SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
}

</style>