<script setup>
import { ref, computed, nextTick, onBeforeMount } from 'vue'
const USER = [
  { name: '豪', counterpoint: ['健', '雄', '龙'] },
  { name: '健', counterpoint: ['豪', '雄', '龙'] },
  { name: '雄', counterpoint: ['健', '豪', '龙'] },
  { name: '雨', counterpoint: ['尧', '摆', '妙'] },
  { name: '尧', counterpoint: ['雨', '摆', '妙'] },
  { name: '硕', counterpoint: ['ding', 'bin'] },
  { name: '龙', counterpoint: ['健', '雄', '豪'] },
  { name: '妙', counterpoint: ['雨', '摆', '尧'] },
  { name: 'bin', counterpoint: ['ding', '硕'] },
  { name: '摆', counterpoint: ['雨', '妙', '尧'] },
  { name: 'ding', counterpoint: ['bin', '硕'] },
]
const url = computed(() => {
  let res = ''
  switch (currentSeason.value) {
    case 'S1':
      res= 'https://rank-history-list-1320720418.cos.ap-guangzhou.myqcloud.com/list.json'
      break
    case 'S2':
      res= 'https://rank-history-list-1320720418.cos.ap-guangzhou.myqcloud.com/S2/list.json'
      break
    default:
      res= 'https://rank-history-list-1320720418.cos.ap-guangzhou.myqcloud.com/list.json'
      break
  }
  return res
})

const rankList = computed(() => USER.map(({ name }) => ({
  name,
  ...(Array.isArray(history.value[name]) ? history.value[name].reduce((acc, item, idx) => {
    if (idx === 0) {
        acc.kill = item.kill
        acc.dead = item.dead
        acc.assist = item.assist
        acc.total = item.total
        acc.win = item.win
        acc.lose = item.lose
        acc.winningRate = (item.win / item.total * 100).toFixed(2) + '%'
        acc.kda = ((item.kill + item.assist) / item.dead).toFixed(2)
        acc.kd = (item.kill / item.dead).toFixed(2)
        acc.rate = item.rate
    } else {
      acc.kill += item.kill
      acc.dead += item.dead
      acc.assist += item.assist
      acc.total += 1
      item.result ? (acc.lose += 1) : (acc.win += 1)
      acc.winningRate = (acc.win / acc.total * 100).toFixed(2) + '%'
      acc.kda = ((acc.kill + acc.assist) / acc.dead).toFixed(2)
      acc.kd = (acc.kill / acc.dead).toFixed(2)
    }
    return acc
  }, {
    kill: 0,
    dead: 0,
    assist: 0,
    total: 0,
    win: 0,
    lose: 0,
    winningRate: 0,
    kda: 0,
    kd: 0,
  }) : {})
})).sort((a, b) => {
  if (!a[sortKey.value]) return 1
  if (!b[sortKey.value]) return -1
  if(a === b) return 0;
  return (a[sortKey.value] > b[sortKey.value] > 0 ? 1 : -1) * sortState.value[sortKey.value]
})
)
const history = ref({})
const displayPopup = ref(false)
const top = ref(0)
const left = ref(0)
const formData = ref({
  result: 0,
  kill: 0,
  dead: 0,
  assist: 0
})
const inputKill = ref(null)
const currentUser = ref(null)
const sortState = ref({})
const sortKey = ref(null)
const panels = ref([
  { label: 'BPHelper For User', value : 'BFU' },
  { label: 'BPHelper For Admin', value : 'BFA' },
  { label: 'List Of DING', value : 'LOD' },
])
const currentPanel = ref('LOD')
const headers = ref([
  { label: '选手', sortKey: 'name' },
  { label: '评级', sortKey: 'rate' },
  { label: '胜率', sortKey: 'winningRate' },
  { label: 'KDA', sortKey: 'kda' },
  { label: 'KD', sortKey: 'kd' },
  { label: '场数', sortKey: 'total' },
  { label: '胜', sortKey: 'win' },
  { label: '负', sortKey: 'lose' },
  { label: 'K', sortKey: 'kill' },
  { label: 'D', sortKey: 'dead' },
  { label: 'A', sortKey: 'assist' },
])
const currentSeason = ref('S1')
const closedSeason = ref(['S1'])

const onPopup = (e, item) => {
  if (closedSeason.value.includes(currentSeason.value)) return
  if (displayPopup.value) return
  const { x, y, offsetY, view: { innerWidth } } = e
  const { name } = item
  currentUser.value = name
  top.value = y + 34 - offsetY
  left.value = x > innerWidth - 760 ? innerWidth - 760 : x
  displayPopup.value = true
  nextTick(() => {
    inputKill.value.focus()
  })
}

const onCancel = () => {
  currentUser.value = null
  formData.value = {
    result: 0,
    kill: 0,
    dead: 0,
    assist: 0
  }
  displayPopup.value = false
}

const onSubmit = async () => {
  await getHistory()
  history.value[currentUser.value].push({ ...formData.value, modified: Date.now() })
  onCancel()
  await asyncHistory()
  await getHistory()
  alert('添加成功')
}

const getHistory = async () => {
  try {
    await fetch(url.value)
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error('网络请求失败')
      }
    })
    .then((json) => {
      history.value = json
    })
    // if (localStorage.getItem('bannedNames')) {
    //   bannedNames.value = JSON.parse(localStorage.getItem('bannedNames'))
    // }
  } catch (err) {
    alert('加载记录数据失败')
  }
}

const asyncHistory = async () => {
  await fetch(url.value, {
    method: 'PUT',
    body: JSON.stringify(history.value)
  })
  .then((res) => {
    if (!res.ok) {
      alert('更新数据失败')
    }
  })
}

const onRemove = async (idx) => {
  if (confirm('是否删除记录#' + (idx + 1))) {
    history.value[currentUser.value].splice(idx, 1)
    await asyncHistory()
  }
}

const onChangeRate = async ({ target: { value } = {} } = {}) => {
  if (confirm('是否修改评级')) {
    history.value[currentUser.value][0].rate = value
    await asyncHistory()
  }
}

const onSort = (key) => {
  sortState.value[key] = ref((sortState.value[key] === 1 || sortState.value[key] === -1) ? sortState.value[key] * -1 : 1)
  sortKey.value = key
}

const onRandom = () => {
  const random1 = Math.floor(Math.random() * USER.length)
  const user1 = USER[random1].name
  const counterpoint = USER[random1].counterpoint
  const user2 = counterpoint[Math.floor(Math.random() * counterpoint.length)]
  alert(`${user1} 和 ${user2}， ${Math.random() > 0.5 ? user2 : user1} 先选。`)
}

onBeforeMount(async () => {
  await getHistory()
})
</script>

<template>
  <label
    v-for="(item, idx) in panels"
    :key="idx"
    :for="item.label.toLowerCase().replaceAll(' ', '-')"
  >
    <input
      :id="item.label.toLowerCase().replaceAll(' ', '-')"
      v-model="currentPanel"
      type="radio"
      :value="item.value"
    >
    {{ item.label }}
  </label>
  <iframe
    v-if="currentPanel === 'BFU'"
    src="https://bphelper-user-1320720418.cos.ap-guangzhou.myqcloud.com/BPHelper%20%E9%80%89%E6%89%8B%E7%89%88.html"
    frameborder="0"
    style="position: fixed; bottom: 0; left: 0; width: 100vw; height: calc(100vh - 1.5rem);"
  />
  <iframe
    v-if="currentPanel === 'BFA'"
    src="https://bphelper-admin-1320720418.cos.ap-guangzhou.myqcloud.com/BPHelper%20%E6%95%99%E7%BB%83%E7%89%88.html"
    frameborder="0"
    style="position: fixed; bottom: 0; left: 0; width: 100vw; height: calc(100vh - 1.5rem);"
  />
  <template v-if="currentPanel === 'LOD'">
    <h2>
      List of DING
      <select
        v-model="currentSeason"
        @change="getHistory"
      >
        <option value="S1">
          S1
        </option>
        <option value="S2">
          S2
        </option>
      </select>
    </h2>
    <button @click="onRandom">
      选组队长
    </button>
    <div class="table-wrapper">
      <table class="fl-table">
        <thead>
          <tr>
            <th
              v-for="(item, idx) in headers"
              :key="idx"
              :class="[{ sorted: item.sortKey === sortKey }, sortState[sortKey] === 1 ? 'up' : 'down']"
              @click="onSort(item.sortKey)"
            >
              {{ item.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, idx) in rankList"
            :key="idx"
            :class="{ active: currentUser === item.name }"
            @click="onPopup($event, item)"
          >
            <td>{{ item.name }}</td>
            <td>{{ item.rate }}</td>
            <td>{{ item.winningRate }}</td>
            <td>{{ item.kda }}</td>
            <td>{{ item.kd }}</td>
            <td>{{ item.total }}</td>
            <td>{{ item.win }}</td>
            <td>{{ item.lose }}</td>
            <td>{{ item.kill }} ({{ (item.kill / item.total).toFixed(0) }})</td>
            <td>{{ item.dead }} ({{ (item.dead / item.total).toFixed(0) }})</td>
            <td>{{ item.assist }} ({{ (item.assist / item.total).toFixed(0) }})</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="displayPopup"
      class="popup"
      :style="{ top: top + 'px', left: left + 'px' }"
    >
      <div style="display: flex;">
        <input
          type="text"
          :value="history[currentUser][0].rate"
          style="width: 2rem; text-align: center;"
          @change="onChangeRate"
        >
        <div class="current-user">
          {{ currentUser }}
        </div>
        <div class="switcher">
          <label
            for="win"
            :class="formData.result === 0 ? 'checked' : ''"
          >
            胜
            <input
              v-show="false"
              id="win"
              v-model="formData.result"
              type="radio"
              :value="0"
            >
          </label>
          <label
            for="lose"
            :class="formData.result === 1 ? 'checked' : ''"
          >
            负
            <input
              v-show="false"
              id="lose"
              v-model="formData.result"
              type="radio"
              :value="1"
            >
          </label>
        </div>
        <div class="input-group">
          <label for="kill">
            K
            <input
              id="kill"
              ref="inputKill"
              v-model="formData.kill"
              type="number"
              min="0"
            >
          </label>
          <label for="dead">
            D
            <input
              id="dead"
              v-model="formData.dead"
              type="number"
              min="0"
            >
          </label>
          <label for="assist">
            A
            <input
              id="assist"
              v-model="formData.assist"
              type="number"
              min="0"
            >
          </label>
        </div>
        <div class="button-group">
          <button
            class="button-submit"
            @click="onSubmit"
          >
            submit
          </button>
          <button
            class="button-cancel"
            @click="onCancel"
          >
            cancel
          </button>
        </div>
      </div>
      <div
        v-for="(item, idx) in history[currentUser]"
        :key="idx"
        class="modified-log"
      >
        <div>#{{ idx + 1 }}</div>
        <div>{{ new Intl.DateTimeFormat('cn', { dateStyle: 'short', timeStyle: 'long' }).format(item.modified).replace('GMT+8', '') }}</div>
        <div>K:{{ item.kill }}</div>
        <div>D:{{ item.dead }}</div>
        <div>A:{{ item.assist }}</div>
        <div v-show="typeof item.result === 'number'">
          {{ item.result === 0 ? 'win' : 'lose' }}
        </div>
        <button
          v-if="idx"
          @click="onRemove(idx)"
        >
          remove
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.popup {
  position: fixed;
  background-color: #FFFFFF;
  border-radius: 4px;
  box-shadow: 0 0 10px 1px #999999;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.current-user {
  display: flex;
  padding: 12px;
}
.switcher {
  display: flex;
}
.switcher label {
  flex: 1;
  padding: 12px;
  color: #FFFFFF;
}
.switcher label:first-child {
  background-color: rgb(38, 89, 255);
  filter: opacity(0.7) grayscale(0.3);
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.switcher label:first-child:hover,
.switcher label.checked {
  filter: opacity(1) grayscale(0);
  cursor: pointer;
}
.switcher label:last-child {
  background-color: rgb(255, 63, 63);
  filter: opacity(0.7) grayscale(0.3);
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
.switcher label:last-child:hover,
.switcher label.checked  {
  filter: opacity(1) grayscale(0);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
  font-weight: bold;
}
.input-group {
  display: flex;
}
.input-group label {
  padding: 12px;
}
.input-group input {
  width: 3rem;
}
.button-submit {
  background-color: rgb(0, 204, 0);
  color: #FFFFFF;
}
.modified-log {
  display: flex;
  flex-direction: row;
  overflow-y: auto;
}
.modified-log > div {
  margin-right: 1rem;
  padding-right: 1rem;
  border-right: 1px solid #999999;
}
.sorted,
.fl-table thead tr th:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  font-weight: bold;
  font-size: 1.2em;
  cursor: pointer;
}
.sorted.up::after {
  margin-left: 4px;
  content: '↓';
}
.sorted.down::after {
  margin-left: 4px;
  content: '↑';
}
</style>
