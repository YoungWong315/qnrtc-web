<template>
  <div class="wrap">
    <div class="navigator">
      <p>学生端{{ index }}</p>
    </div>
    <div class="tracks-wrap">
      <div class="romotetracks-wrap">
        <p>远端音视频轨</p>
        <div id="remotetracks"></div>
        <div class="tool-bar">
          <!-- camera-video-off -->
          <div @click="muteVideo">
            <b-icon
              font-size="40"
              :icon="
                muteVideoFlag ? 'camera-video-off-fill' : 'camera-video-fill'
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
          <!-- mic-mute -->
          <div @click="muteAudio">
            <b-icon
              font-size="32"
              :icon="muteFlag ? 'mic-mute-fill' : 'mic-fill'"
              style="color:#808080;"
            ></b-icon>
          </div>
        </div>
      </div>
      <!-- 当前用户屏幕 -->
      <div class="localtracks-wrap">
        <p>当前用户音视频轨</p>
        <div id="localtracks" style="width: 200px;"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Teacher',
  data() {
    return {
      publishFlag: false,
      index: '',

      muteFlag: false,
      muteVideoFlag: false,
    }
  },
  components: {},
  mounted() {
    const { token, index } = this.$route.query
    this.token = token
    this.index = index
  },
  methods: {
    async joinRoom() {
      this.publishFlag = true
      // 初始化一个房间 Session 对象, 这里使用 Track 模式
      const myRoom = new this.$QNRTC.TrackModeSession()
      this.myRoom = myRoom
      // 这里替换成刚刚生成的 RoomToken
      await myRoom.joinRoomWithToken(this.token)
      console.log('joinRoom success!')

      // 自动订阅
      this.autoSubscribe(myRoom)

      // 发布自己的流
      await this.publish(myRoom)
    },
    // 这里的参数 myRoom 是指刚刚加入房间时初始化的 Session 对象, 同上
    // trackInfoList 是一个 trackInfo 的列表，订阅支持多个 track 同时订阅。
    async subscribe(myRoom, trackInfoList) {
      // 通过传入 trackId 调用订阅方法发起订阅，成功会返回相应的 Track 对象，也就是远端的 Track 列表了
      // 只显示老师端
      const filterdTrackInfoList = trackInfoList.filter(
        info => info.userId === '123456',
      )
      const remoteTracks = await myRoom.subscribe(
        filterdTrackInfoList.map(info => info.trackId),
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
      localElement.innerHTML = '' // 清除之前的数据
      // 遍历本地采集的 Track 对象
      for (const localTrack of localTracks) {
        // 如果这是麦克风采集的音频 Track，我们就不播放它。
        if (localTrack.info.tag === 'audio') continue
        // 调用 Track 对象的 play 方法在这个元素下播放视频轨
        localTrack.play(localElement, true)
      }
    },
    leaveRoom() {
      try {
        this.myRoom.leaveRoom()
        this.publishFlag = false
      } catch (e) {
        console.log(e)
      }
    },
    muteAudio() {
      this.muteFlag = !this.muteFlag
      try {
        const publishedTracks = this.myRoom.publishedTracks
        if (publishedTracks) {
          let muteTracks = []
          publishedTracks.forEach(track => {
            // muteTracks 文档
            // https://doc.qnsdk.com/rtn/web/docs/pub_unpub_tracks
            const { kind, trackId } = track.info
            if (kind === 'audio') {
              muteTracks.push({
                trackId,
                muted: this.muteFlag,
              })
            }
          })
          this.myRoom.muteTracks(muteTracks)
        }
      } catch (e) {
        console.log(e)
      }
    },
    muteVideo() {
      this.muteVideoFlag = !this.muteVideoFlag
      try {
        const publishedTracks = this.myRoom.publishedTracks
        let muteTracks = []
        publishedTracks.forEach(track => {
          // muteTracks 文档
          // https://doc.qnsdk.com/rtn/web/docs/pub_unpub_tracks
          const { kind, trackId } = track.info
          if (kind === 'video') {
            muteTracks.push({
              trackId,
              muted: this.muteVideoFlag,
            })
          }
        })
        this.myRoom.muteTracks(muteTracks)
      } catch (e) {
        console.log(e)
      }
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
.romotetracks-wrap {
  position: relative;
  margin: 0 auto;
  height: 100%;
}
#remotetracks {
  height: 100%;
}
.romotetracks-wrap video {
  height: 100%;
}
.romotetracks-wrap p {
  color: red;
  background: rgba(255, 255, 255, 0.8);
  position: absolute;
  top: 5px;
  left: 5px;
}
.localtracks-wrap {
  position: absolute;
  left: 20px;
  bottom: 100px;
}
.localtracks-wrap p {
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
