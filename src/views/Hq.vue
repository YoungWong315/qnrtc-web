<template>
  <div class="wrap">
    <div class="navigator">
      <p>老师端</p>
      <button @click="goStudent1">去学生端1</button>
      <button @click="goStudent2">去学生端2</button>
    </div>
    <div class="tracks-wrap">
      <!-- 自己的视频 -->
      <div class="localtracks-wrap">
        <div id="localtracks"></div>
        <div class="tool-bar">
          <!-- camera-video-off -->
          <div @click="stopVideo">
            <b-icon
              font-size="40"
              :icon="
                closeVideoFlag ? 'camera-video-off-fill' : 'camera-video-fill'
              "
              style="color:#808080;"
            ></b-icon>
          </div>
          <div @click="joinRoom">
            <b-icon
              font-size="50"
              :icon="publishFlag ? 'stop-fill' : 'play-fill'"
              style="color:#808080;"
            ></b-icon>
          </div>
          <!-- <div @click="joinRoom" v-if="!publishFlag">
            <img src="@/assets/img/call.png" alt="" />
          </div>
          <div @click="quit" v-if="publishFlag">
            <img src="@/assets/img/quit.png" alt="" />
          </div> -->
          <!-- mic-mute -->
          <div @click="mute">
            <b-icon
              font-size="32"
              :icon="muteFlag ? 'mic-mute-fill' : 'mic-fill'"
              style="color:#808080;"
            ></b-icon>
          </div>
        </div>
      </div>
      <!-- 别人的订阅 -->
      <div class="remotetracks-wrap">
        <p>订阅音视频轨</p>
        <div
          v-for="{ track, index } in remotetracks"
          :key="index"
          :ref="'remotetracks' + index"
          id="remotetracks"
          style="width: 200px;"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Hq',
  data() {
    return {
      publishFlag: false,
      remotetracks: [],

      muteFlag: false,
      closeVideoFlag: false,
    }
  },
  components: {},
  mounted() {
    console.log(process.env.VUE_APP_BASEURL)
    console.log(this.$service)
  },
  methods: {
    goStudent1() {
      const routeUrl = this.$router.resolve({
        name: 'Student',
        query: {
          token:
            'WPXVZzkt4HEzsZdmFez23jL6nb_jWXPmx_sUX7lz:AfkVbu_OJAznCbdCZZsw_QyeIqM=:eyJhcHBJZCI6ImYyZTByMXdueCIsInJvb21OYW1lIjoidGVzdC0wMDEiLCJ1c2VySWQiOiIxMjM0NjYiLCJleHBpcmVBdCI6MTU5ODU4MDkxNiwicGVybWlzc2lvbiI6InVzZXIifQ==',
          index: '1',
        },
      })
      window.open(routeUrl.href, '_blank')
    },
    goStudent2() {
      const routeUrl = this.$router.resolve({
        name: 'Student',
        query: {
          token:
            'WPXVZzkt4HEzsZdmFez23jL6nb_jWXPmx_sUX7lz:Kt1ivTcHXhj8eY-OSZwjE9p3DH0=:eyJhcHBJZCI6ImYyZTByMXdueCIsInJvb21OYW1lIjoidGVzdC0wMDEiLCJ1c2VySWQiOiIxMjM0NjUiLCJleHBpcmVBdCI6MTU5ODU4MjgzMywicGVybWlzc2lvbiI6InVzZXIifQ==',
          index: '2',
        },
      })
      window.open(routeUrl.href, '_blank')
    },
    async joinRoom() {
      if (this.publishFlag) {
        this.leaveRoom()
        return
      }
      this.publishFlag = true
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
      this.autoSubscribe(myRoom)

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
    // 这里的参数 myRoom 是指刚刚加入房间时初始化的 Session 对象, 同上
    // trackInfoList 是一个 trackInfo 的列表，订阅支持多个 track 同时订阅。
    async subscribe(myRoom, trackInfoList) {
      // 通过传入 trackId 调用订阅方法发起订阅，成功会返回相应的 Track 对象，也就是远端的 Track 列表了
      const remoteTracks = await myRoom.subscribe(
        trackInfoList.map(info => info.trackId),
      )

      // 遍历返回的远端 Track，调用 play 方法完成在页面上的播放
      remoteTracks.forEach((remoteTrack, index) => {
        // 调用 Track 对象的 play 方法在这个元素下播放视频轨
        this.remotetracks.push(remoteTrack)
        // TODO: 测试 -----------------------------------------------------<
        console.log(this.$refs['remotetracks' + index])
        remoteTrack.play(this.$refs['remotetracks' + index], true)
      })

      /* // 选择页面上的一个元素作为父元素，播放远端的音视频轨
      const remoteElement = document.getElementById('remotetracks')
      // 遍历返回的远端 Track，调用 play 方法完成在页面上的播放
      for (const remoteTrack of remoteTracks) {
        remoteTrack.play(remoteElement)
      } */
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
    },
    leaveRoom() {
      try {
        const publishedTracks = this.myRoom.publishedTracks
        publishedTracks.forEach(track => track.release())
        this.publishFlag = false
      } catch (e) {
        console.log(e)
      }
    },
    mute() {
      this.muteFlag = !this.muteFlag
      try {
        const publishedTracks = this.myRoom.publishedTracks
        // publishedTracks.forEach(track => track.release())
        if (publishedTracks) {
          this.myRoom.muteTracks(publishedTracks)
        }
      } catch (e) {
        console.log(e)
      }
    },
    stopVideo() {
      console.log('stopVideo')
      this.closeVideoFlag = !this.closeVideoFlag
    },
  },
}
</script>

<style scoped>
.wrap {
  position: relative;
  height: 100vh;
  background: #000;
}
.navigator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 100;
}
.tracks-wrap {
  position: relative;
  height: 100%;
}
.localtracks-wrap {
  position: relative;
  height: 100%;
  margin: 0 auto;
}
#localtracks {
  height: 100%;
}
.localtracks-wrap video {
  height: 100%;
}
.localtracks-wrap p {
  color: red;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 100;
}
.remotetracks-wrap {
  position: absolute;
  left: 20px;
  bottom: 20px;
}
.remotetracks-wrap p {
  color: green;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  top: 5px;
  left: 5px;
}
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
  margin-right: 10px;
  cursor: pointer;
}
.tool-bar img {
  width: 40px;
  height: 40px;
}
</style>
