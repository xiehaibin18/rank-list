<script setup>
import { ref, onBeforeMount, computed } from 'vue'
import listJson from '../assets/list.json'

const list = ref(listJson)
const bannedNames = ref([])
// const filteredList = ref(list.value.slice())
const inputedKey = ref('')
const timer = ref(0)
const timerId = ref(null)
const categroyItems = [
  { name: '上', categroy: 'top' },
  { name: '中', categroy: 'mid' },
  { name: '射', categroy: 'bot' },
  { name: '辅', categroy: 'sup' },
  { name: '野', categroy: 'jungle' },
]
const selectedCategroies = ref([])
const timerStr = computed(() => (5 - timer.value / 1000) > 0 ? `${(5 - timer.value / 1000)}s` : '更新中')
const filteredList = computed(() => {
  return list.value
  .slice()
  .filter(({ name }) => !inputedKey.value || name.includes(inputedKey.value))
  .filter((({ categroies }) => selectedCategroies.value.length === 0 || categroies.some((c) => selectedCategroies.value.includes(c))))
})

const onBan = async (name) => {
  const res = confirm(`把 "${name}" Ban了?`)
  if (res) {
    await updateBannedList()
    if (bannedNames.value.includes(name)) return
    bannedNames.value.push(name)
    // localStorage.setItem('bannedNames', JSON.stringify(bannedNames.value))
    await fetch('https://baned-list-1320720418.cos.ap-guangzhou.myqcloud.com/banned-list.json', {
      method: 'PUT',
      body: JSON.stringify(bannedNames.value)
    })
    .then((res) => {
      if (!res.ok) {
        alert('更新数据失败')
      }
    })
    console.log('bannedNames updated')
  }
}

const onReset = () => {
  inputedKey.value = ''
  selectedCategroies.value = []
}

const onClear = async () => {
  const res = confirm('是否清除所有的ban选历史记录？')
  if (res) {
    // localStorage.clear()
    await fetch('https://baned-list-1320720418.cos.ap-guangzhou.myqcloud.com/banned-list.json', {
      method: 'PUT',
      body: JSON.stringify([])
    })
    .then((res) => {
      if (!res.ok) {
        alert('更新数据失败')
      }
    })
    bannedNames.value = []
    onReset()
  }
}

const updateBannedList = async () => {
  try {
    await fetch('https://baned-list-1320720418.cos.ap-guangzhou.myqcloud.com/banned-list.json')
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        throw new Error('网络请求失败')
      }
    })
    .then((json) => {
      bannedNames.value = json
    })
    // if (localStorage.getItem('bannedNames')) {
    //   bannedNames.value = JSON.parse(localStorage.getItem('bannedNames'))
    // }
  } catch (err) {
    alert('加载记录数据失败')
  } finally {
    timer.value = 0
  }
}

const onStop = () => {
  clearInterval(timerId.value)
  timerId.value = null
}

const onStart = () => {
  timerId.value = setInterval(async () => {
    if (timer.value === 5000) {
      timer.value = 9999
      await updateBannedList()
    } else {
      timer.value += 1000
    }
  }, 1000)
}

onBeforeMount(async () => {
  await updateBannedList()
  // this.onStart()
})
</script>

<template>
  <div class="tool-bar">
    选手你好！
    <input
      v-model="inputedKey"
      class="search-input"
      type="text"
      placeholder="输入英雄称号进行搜索"
    >
    <label
      v-for="(item, idx) in categroyItems"
      :key="item.name + idx"
      :for="item.name + idx"
    >
      <input
        :id="item.name + idx"
        v-model="selectedCategroies"
        type="radio"
        :value="item.categroy"
      >
      {{ item.name }}
    </label>
    <button @click="onReset">
      重置筛选条件
    </button>
    <button v-if="false" @click="onClear">
      清除记录
    </button>
    <span v-if="false && timerId">
      刷新倒计时：{{ timerStr }}
    </span>
    <button
      v-if="false"
      @click="() => timerId === null ? onStart() : onStop()"
    >
      {{ timerId === null ? '开始' : '暂停' }}同步
    </button>
  </div>
  <div class="content">
    <div class="left allow">
      <div
        v-for="(item, idx) in filteredList"
        v-show="!bannedNames.includes(item.name)"
        :key="idx"
        class="item"
      >
        <img
          :src="item.src"
          width="46"
          height="46"
        ><span>{{ item.name }}</span>
      </div>
    </div>
    <div class="right banned-list disabled">
      <div>已禁选</div>
      <div
        v-for="(item, idx) in filteredList.filter((i) => bannedNames.includes(i.name))"
        :key="idx"
        class="item"
      >
        <img
          :src="item.src"
          width="46"
          height="46"
        ><span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-bar {
  font-size: 2rem;
}
.search-input {
  font-size: 2rem;
}
.content {
  display: flex;
  flex-direction: row;
}
.content .left {
  flex: 1;
  width: 50%;
}
.content .right {
  flex: 1;
  filter: opacity(0.8) grayscale(0.8);;
}
.item {
  background-color: #fff;
  color: #000;
  margin: 6px;
  border-radius: 4px;
  width: 25%;
  display: inline-flex;
  align-items: center;
}
.item span {
  width: 100%;
}
.disabled span {
  text-decoration: line-through;
  color: red;
}
</style>
