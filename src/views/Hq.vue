<template>
  <div>
    <p>总部端</p>
    <button @click="joinRoom">发布流</button>
    <button @click="goTeacher">去老师端看</button>
    <button @click="goStudent">去学生端看</button>
    <div v-if="published">
      <!-- 自己的视频 -->
      <div class="localtracks-wrap">
        <p>本地音视频轨</p>
        <div id="localtracks"></div>
        <div class="tool-bar">
          <div @click="quit">
            <img src="@/assets/img/quit.png" alt="" />
          </div>
        </div>
      </div>
      <!-- 别人的订阅 -->
      <!-- <div class="remotetracks-wrap">
        <p>订阅音视频轨</p>
        <div id="remotetracks" style="width: 200px;"></div>
      </div> -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'Hq',
  data() {
    return {
      published: false,
      subscribed: false,
    }
  },
  components: {},
  mounted() {
    console.log(process.env.VUE_APP_BASEURL)
    console.log(this.$service)
  },
  methods: {
    goTeacher() {
      const routeUrl = this.$router.resolve({
        name: 'Teacher',
        query: {
          token:
            'WPXVZzkt4HEzsZdmFez23jL6nb_jWXPmx_sUX7lz:lqqT6agtWcr7Lu5RGKO7z5S-CM8=:eyJhcHBJZCI6ImYyZTByMXdueCIsInJvb21OYW1lIjoidGVzdC0wMDEiLCJ1c2VySWQiOiIyMzQ1NjciLCJleHBpcmVBdCI6MTU5ODQ4MjM1NSwicGVybWlzc2lvbiI6InVzZXIifQ==',
        },
      })
      window.open(routeUrl.href, '_blank')
    },
    goStudent() {
      const routeUrl = this.$router.resolve({
        name: 'Student',
        query: {
          token:
            'WPXVZzkt4HEzsZdmFez23jL6nb_jWXPmx_sUX7lz:_QZ7IwlvbS_laan9E8lKmPuhz04=:eyJhcHBJZCI6ImYyZTByMXdueCIsInJvb21OYW1lIjoidGVzdC0wMDExIiwidXNlcklkIjoiMTIzNDY2IiwiZXhwaXJlQXQiOjE1OTg1NzEyNDYsInBlcm1pc3Npb24iOiJ1c2VyIn0=',
        },
      })
      window.open(routeUrl.href, '_blank')
    },
    async joinRoom() {
      this.published = true
      const ROOMTOKEN_1 =
        'WPXVZzkt4HEzsZdmFez23jL6nb_jWXPmx_sUX7lz:qXBmwQo51lTjuZ4cjDplF1RtZ3U=:eyJhcHBJZCI6ImYyZTByMXdueCIsInJvb21OYW1lIjoidGVzdC0wMDEiLCJ1c2VySWQiOiIxMjM0NTYiLCJleHBpcmVBdCI6MTU5ODQ4MjM1NSwicGVybWlzc2lvbiI6ImFkbWluIn0='
      // 初始化一个房间 Session 对象, 这里使用 Track 模式
      const myRoom = new this.$QNRTC.TrackModeSession()
      this.myRoom = myRoom
      // 这里替换成刚刚生成的 RoomToken
      await myRoom.joinRoomWithToken(ROOMTOKEN_1)
      console.log('joinRoom success!')

      console.log(myRoom)

      // 自动订阅
      // this.autoSubscribe(myRoom)

      // 发布
      await this.publish(myRoom)
    },
    async publish(myRoom) {
      // 我们打开了 3 个参数，即采集音频，采集视频，采集屏幕共享。
      // 这个函数会返回一个列表，列表中每一项就是一个音视频轨对象
      const localTracks = await this.$QNRTC.deviceManager.getLocalTracks({
        audio: { enabled: true, tag: 'audio' },
        video: { enabled: true, tag: 'video' },
        // screen: { enabled: true, tag: 'screen' },
      })
      console.log('my local tracks', localTracks)
      // 将刚刚的 Track 列表发布到房间中
      await myRoom.publish(localTracks)
      console.log('publish success!')

      // 在这里添加
      // 获取页面上的一个元素作为播放画面的父元素
      const localElement = document.getElementById('localtracks')
      // 遍历本地采集的 Track 对象
      for (const localTrack of localTracks) {
        // 如果这是麦克风采集的音频 Track，我们就不播放它。
        if (localTrack.info.tag === 'audio') continue
        // 调用 Track 对象的 play 方法在这个元素下播放视频轨
        localTrack.play(localElement, true)
      }
    },
    quit() {
      const publishedTracks = this.myRoom.publishedTracks
      publishedTracks.forEach(track => track.release())
    },
    /* // 这里的参数 myRoom 是指刚刚加入房间时初始化的 Session 对象, 同上
    // trackInfoList 是一个 trackInfo 的列表，订阅支持多个 track 同时订阅。
    async subscribe(myRoom, trackInfoList) {
      // 通过传入 trackId 调用订阅方法发起订阅，成功会返回相应的 Track 对象，也就是远端的 Track 列表了
      const remoteTracks = await myRoom.subscribe(
        trackInfoList.map(info => info.trackId),
      )

      // 选择页面上的一个元素作为父元素，播放远端的音视频轨
      const remoteElement = document.getElementById('remotetracks')
      // 遍历返回的远端 Track，调用 play 方法完成在页面上的播放
      for (const remoteTrack of remoteTracks) {
        remoteTrack.play(remoteElement)
      }
    },
    // 这里的参数 myRoom 是指刚刚加入房间时初始化的 Session 对象, 同上
    async autoSubscribe(myRoom) {
      const trackInfoList = myRoom.trackInfoList
      console.log('room current trackInfo list', trackInfoList)

      // 调用我们刚刚编写的 subscribe 方法
      // 注意这里我们没有使用 async/await，而是使用了 Promise，大家可以思考一下为什么
      this.subscribe(myRoom, trackInfoList)
        .then(() => console.log('subscribe success!'))
        .catch(e => console.error('subscribe error', e))

      // 添加事件监听，当房间中出现新的 Track 时就会触发，参数是 trackInfo 列表
      myRoom.on('track-add', trackInfoList => {
        console.log('get track-add event!', trackInfoList)
        this.subscribe(myRoom, trackInfoList)
          .then(() => console.log('subscribe success!'))
          .catch(e => console.error('subscribe error', e))
      })
      // 就是这样，就像监听 DOM 事件一样通过 on 方法监听相应的事件并给出处理函数即可
    }, */
  },
}
</script>

<style scoped>
.localtracks-wrap {
  position: relative;
  width: 60vw;
  height: 45vw;
  margin: 0 auto;
  background: #000;
}
.localtracks-wrap p {
  color: red;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  top: 5px;
  left: 5px;
}
/* .remotetracks-wrap {
  position: relative;
}
.remotetracks-wrap p {
  color: green;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  top: 5px;
  left: 5px;
} */
.tool-bar {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-bar > div {
  background: #fff;
  border-radius: 50%;
}
.tool-bar img {
  width: 50px;
  height: 50px;
}
</style>
