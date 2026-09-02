<template>
  <view class="prototype-shell" :data-user-mode="mode">
    <view v-if="!appReady" class="onboarding">
      <view class="brand-row"
        ><view class="brand-mark"
          ><image :src="magpieAsset" mode="aspectFit" /></view
        ><view
          ><text class="brand-name">小喜鹊</text
          ><text class="brand-caption">科学运动，轻松坚持</text></view
        ></view
      >
      <view
        v-if="onboardingStep === 'mode'"
        class="onboarding-card"
        data-testid="onboarding-mode"
      >
        <image class="welcome-magpie" :src="magpieAsset" mode="aspectFit" />
        <text class="panel-kicker">选择使用方式</text
        ><text class="panel-title">今天从哪里开始？</text>
        <button
          class="mode-card mode-card--public"
          data-testid="choose-public"
          @tap="chooseMode('public')"
        >
          <view class="mode-icon"
            ><AppIcon
              src="/static/icons/magpie-line/exercise.svg"
              :size="46" /></view
          ><view
            ><text>日常运动</text><text>无需评估，直接开始今日运动</text></view
          ><text>›</text>
        </button>
        <button
          class="mode-card"
          data-testid="choose-cardiac"
          @tap="chooseMode('cardiac')"
        >
          <view class="mode-icon"
            ><AppIcon
              src="/static/icons/magpie-line/heart-rate.svg"
              :size="46" /></view
          ><view
            ><text>心脏康复</text
            ><text>关联医院计划，按策略记录状态</text></view
          ><text>›</text>
        </button>
        <button class="text-button" @tap="showAiBoundary = true">
          健康助手与医疗边界
        </button>
      </view>
      <view v-else class="onboarding-card" data-testid="onboarding-binding">
        <button class="back-link" @tap="backToMode">‹ 返回</button
        ><text class="panel-kicker">关联康复计划</text
        ><text class="panel-title">输入患者号</text
        ><text class="panel-copy"
          >演示支持 {{ sharedPatientFixture.hospital.name }}</text
        >
        <view class="field-block"
          ><text>医院</text
          ><view class="hospital-select"
            ><AppIcon
              src="/static/icons/magpie-line/archive.svg"
              :size="32"
            /><text>{{ sharedPatientFixture.hospital.name }}</text
            ><text>✓</text></view
          ></view
        >
        <view class="field-block"
          ><text>患者号</text
          ><input
            v-model="visitNumber"
            class="text-input"
            data-testid="visit-number"
            placeholder="输入 256572 或 P-256572"
            maxlength="16"
        /></view>
        <view v-if="bindingState === 'matched'" class="match-card"
          ><text>✓</text
          ><view
            ><text>已匹配康复计划</text
            ><text
              >{{ sharedPatientFixture.patient.maskedName }} ·
              {{ sharedPatientFixture.patient.rehabStage }}</text
            ><text
              >{{ sharedPatientFixture.prescription.prescriptionNo }} ·
              {{ sharedPatientFixture.prescription.version }}</text
            ></view
          ></view
        >
        <text v-if="bindingState === 'error'" class="form-error"
          >未找到计划，请检查患者号。</text
        >
        <button
          class="primary-button"
          :loading="bindingState === 'loading'"
          data-testid="bind-plan"
          @tap="bindPatient"
        >
          {{ bindingState === "matched" ? "进入今日计划" : "查询计划" }}
        </button>
      </view>
    </view>

    <template v-else>
      <view v-if="detailView === 'none'" class="app-frame">
        <view class="topbar"
          ><view
            ><text class="topbar-title">{{ topbarTitle }}</text
            ><text class="topbar-copy">{{ todayLabel }}</text></view
          ><button class="avatar-button" @tap="activeNav = 'profile'">
            {{ displayName.slice(0, 1) }}
          </button></view
        >
        <scroll-view class="page-scroll" :scroll-y="activeNav !== 'today'">
          <view
            v-if="activeNav === 'today'"
            class="today-pager-shell"
            data-testid="today-screen"
          >
            <view class="today-pager-tabs" data-testid="today-pager-tabs">
              <button
                :class="{ selected: todayPageIndex === TODAY_PAGE_EXERCISE }"
                data-testid="today-tab-exercise"
                data-action="ACT-SHOW-EXERCISE"
                @tap="showTodayPage(TODAY_PAGE_EXERCISE)"
              >
                <text>运动</text><text>{{ exercisePageStatus }}</text>
              </button>
              <button
                :class="{ selected: todayPageIndex === TODAY_PAGE_GARDEN }"
                data-testid="today-tab-garden"
                data-action="ACT-SHOW-GARDEN"
                @tap="showTodayPage(TODAY_PAGE_GARDEN)"
              >
                <text>菜园</text
                ><text
                  >{{ gardenViewState.cycleDay }}/{{
                    gardenViewState.cycleLength
                  }}</text
                >
              </button>
            </view>

            <swiper
              class="today-page-swiper"
              :current="todayPageIndex"
              :disable-touch="prescriptionGestureActive"
              data-testid="today-page-swiper"
              @change="onTodayPageChange"
            >
              <swiper-item>
                <scroll-view
                  class="today-page-scroll"
                  scroll-y
                  :scroll-top="exerciseScrollTop"
                >
                  <view
                    class="screen today-screen"
                    data-testid="today-exercise-page"
                  >
                    <button
                      v-if="mode === 'cardiac'"
                      class="exercise-garden-strip"
                      data-testid="exercise-garden-strip"
                      data-action="ACT-SHOW-GARDEN"
                      @tap="showTodayPage(TODAY_PAGE_GARDEN)"
                    >
                      <image
                        src="/static/icons/cabbage-checkin.svg"
                        mode="aspectFit"
                      />
                      <view>
                        <text>{{ gardenStripTitle }}</text>
                        <text>{{ gardenStripCopy }}</text>
                      </view>
                      <text>查看 ›</text>
                    </button>
            <view class="today-summary">
              <view class="today-summary__head"
                ><view
                  ><text>{{
                    mode === "cardiac"
                      ? prescriptionAllDone
                        ? "今日处方已完成"
                        : checkInDone
                          ? "今天已打卡，处方继续完成"
                          : "医院今日处方"
                      : publicTodayCompleted
                        ? "今天已经运动"
                        : "今天想怎么动？"
                  }}</text
                  ><text>{{
                    mode === "cardiac"
                      ? checkInDone
                        ? "打卡已保存，不需要为了积分额外加量"
                        : "完成第一项有效运动后自动打卡"
                      : publicTodayCompleted
                        ? "今天的运动已记录，按状态休息即可"
                        : "为你推荐一项，也可以自由选择"
                  }}</text></view
                ><button @tap="openGardenCheckIn">打卡日历 ›</button></view
              >
              <view class="today-summary__numbers"
                ><view
                  ><text>{{ weeklyCompletedDays }}<text>/7</text></text
                  ><text>本周训练</text></view
                ><view
                  ><text
                    >{{
                      mode === "public"
                        ? publicCompletedMinutes
                        : completedMinutes
                    }}<text>分钟</text></text
                  ><text>今日运动</text></view
                ><view
                  ><text>{{ streak }}<text>天</text></text
                  ><text>连续打卡</text></view
                ></view
              >
            </view>
            <button
              class="today-steps-card"
              data-testid="today-steps-card"
              @tap="goDetail('devices')"
            >
              <view class="today-steps-card__head">
                <view class="today-steps-card__icon">步</view>
                <view>
                  <text>今日步数</text>
                  <text v-if="validTodayStepRecord"
                    >{{ formatSteps(validTodayStepRecord.steps) }}
                    <text>/ {{ formatSteps(validTodayStepRecord.goal) }} 步</text></text
                  >
                  <text v-else>今日步数未同步</text>
                </view>
                <text>{{ validTodayStepRecord ? "查看数据 ›" : "去同步 ›" }}</text>
              </view>
              <view class="steps-progress" aria-hidden="true">
                <view :style="{ width: todayStepProgress + '%' }" />
              </view>
              <text class="today-steps-card__source">
                {{
                  validTodayStepRecord
                    ? `${sourceLabel(validTodayStepRecord.source)} · ${formatStepSyncedTime(validTodayStepRecord.syncedAt)}更新`
                    : "连接设备或手动补录；缺失值不会显示为 0"
                }}
              </text>
            </button>
            <template v-if="mode === 'cardiac'">
              <view class="prescription-head"
                ><view
                  ><text>医生今日处方</text
                  ><text
                    >{{ sharedPatientFixture.prescription.version }} ·
                    {{ sharedPatientFixture.patient.assignedDoctor }}</text
                  ></view
                ><text
                  >已完成 {{ prescriptionCompletedCount }}/{{
                    prescriptionTasks.length
                  }}</text
                ></view
              >
              <view
                class="prescription-carousel"
                @touchstart.stop="setPrescriptionGesture(true)"
                @touchmove.stop
                @touchend.stop="setPrescriptionGesture(false)"
                @touchcancel.stop="setPrescriptionGesture(false)"
                @mousedown.stop
              >
                <view
                  class="prescription-pagination"
                  data-testid="prescription-pagination"
                >
                  <text
                    >{{ prescriptionSlide + 1 }}/{{
                      prescriptionTasks.length
                    }}</text
                  >
                  <view>
                    <text
                      v-for="(task, index) in prescriptionTasks"
                      :key="task.key"
                      :class="{
                        active: prescriptionSlide === index,
                        complete: task.completed,
                      }"
                    />
                  </view>
                </view>
                <swiper
                  class="prescription-swiper"
                  :current="prescriptionSlide"
                  data-testid="prescription-swiper"
                  @change="onPrescriptionSlide"
                >
                  <swiper-item
                    v-for="task in prescriptionTasks"
                    :key="task.key"
                    data-testid="prescription-slide"
                  >
                    <view
                      class="today-task prescription-card"
                      :class="{ complete: task.completed }"
                      data-testid="today-core-task"
                      ><view class="task-heading"
                        ><view
                          ><text>{{ task.item.category }}</text
                          ><text>{{ task.item.reason }}</text></view
                        ><text>{{
                          task.completed ? "已完成" : "待完成"
                        }}</text></view
                      ><view class="task-main"
                        ><view class="task-media"
                          ><AppIcon
                            :src="
                              task.game?.iconPath ||
                              '/static/icons/magpie-line/exercise.svg'
                            "
                            :size="62"
                            color="#0F766E" /></view
                        ><view class="task-body"
                          ><view class="tag-row"
                            ><text>医院处方</text
                            ><text>{{
                              sharedPatientFixture.prescription.version
                            }}</text
                            ><text v-if="task.game?.arSupported"
                              >AR互动</text
                            ></view
                          ><text class="task-title">{{ task.item.project }}</text
                          ><text class="task-copy">{{
                            task.item.intensity
                          }}</text></view
                        ></view
                      ><view class="task-meta"
                        ><view
                          ><text>时长</text
                          ><text>{{ task.item.duration }}</text></view
                        ><view
                          ><text>频次</text
                          ><text>{{ task.item.frequency }}</text></view
                        ><view
                          ><text>状态</text
                          ><text>{{
                            task.completed ? "完成" : "待训练"
                          }}</text></view
                        ></view
                      ><text v-if="planAdjustment" class="plan-adjustment"
                        >医生已确认：{{ planAdjustment }}</text
                      ><button
                        v-if="task.game"
                        class="task-primary"
                        @tap="startPrescriptionTask(task)"
                      >
                        {{
                          task.completed ? "再次训练" : "开始这一项"
                        }}</button
                      ><button v-else class="task-primary" disabled>
                        暂未适配小程序训练
                      </button></view
                  ></swiper-item>
                </swiper>
              </view>
            </template>
            <template v-else>
              <view class="prescription-head public-recommendation-head">
                <view>
                  <text>今日推荐</text>
                  <text
                    >根据“{{ publicRecommendationGoalLabel }}”目标推荐</text
                  >
                </view>
                <text>目标推荐</text>
              </view>
              <view
                class="today-task recommended-exercise-card"
                :class="{ complete: publicRecommendedCompleted }"
                data-testid="public-recommended-exercise"
              >
                <view class="task-heading">
                  <view>
                    <text>{{ publicRecommendedCategory.title }}</text>
                    <text>{{ publicRecommendedGame.subtitle }}</text>
                  </view>
                  <text>{{
                    publicRecommendedCompleted ? "已运动" : "推荐"
                  }}</text>
                </view>
                <view class="task-main">
                  <view class="task-media">
                    <AppIcon
                      :src="publicRecommendedGame.iconPath"
                      :size="62"
                      color="#0F766E"
                    />
                  </view>
                  <view class="task-body">
                    <view class="tag-row">
                      <text>目标推荐</text>
                      <text>{{ publicRecommendedCategory.shortTitle }}</text>
                      <text v-if="publicRecommendedGame.arSupported"
                        >AR互动</text
                      >
                    </view>
                    <text class="task-title">{{ publicRecommendedGame.title }}</text>
                    <text class="task-copy">{{ publicRecommendedGame.feature }}</text>
                  </view>
                </view>
                <view class="task-meta">
                  <view>
                    <text>时长</text>
                    <text>{{ publicRecommendedGame.duration }}</text>
                  </view>
                  <view>
                    <text>方式</text>
                    <text>{{ publicRecommendedGame.feature }}</text>
                  </view>
                  <view>
                    <text>状态</text>
                    <text>{{
                      publicRecommendedCompleted ? "已训练" : "可开始"
                    }}</text>
                  </view>
                </view>
                <button
                  class="task-primary"
                  data-testid="start-public-recommended"
                  @tap="startPublicRecommended"
                >
                  {{
                    publicRecommendedCompleted ? "再次运动" : "开始运动"
                  }}
                </button>
              </view>
            </template>
            <view
              class="section-heading exercise-picker-heading"
              :data-testid="
                mode === 'public'
                  ? 'public-exercise-picker'
                  : 'cardiac-self-exercise-picker'
              "
              ><view
                ><text>更多运动</text
                ><text>{{
                  mode === "public"
                    ? "也可以按兴趣自由选择"
                    : "自选内容不会改变医生处方"
                }}</text></view
              ></view
            >
            <view class="category-grid"
              ><button
                v-for="category in exerciseCategories"
                :key="category.id"
                :class="{
                  active:
                    (mode === 'public'
                      ? selectedCategoryId
                      : expandedCategoryId) === category.id,
                }"
                data-testid="exercise-category"
                @tap="toggleCategory(category.id)"
              >
                <view
                  ><AppIcon
                    :src="category.iconPath"
                    :size="38"
                    color="#11866F" /></view
                ><text>{{ category.shortTitle }}</text>
              </button></view
            >
            <view
              v-if="mode === 'public' || expandedCategoryId"
              class="inline-game-grid"
              data-testid="self-directed-game-list"
              ><button
                v-for="game in visibleSelfDirectedGames"
                :key="game.id"
                :class="{ selected: selfSelectedGameId === game.id }"
                data-testid="self-directed-game"
                @tap="chooseSelfDirected(game.id)"
              >
                <view
                  ><AppIcon
                    :src="game.iconPath"
                    :size="42"
                    color="#0F766E" /></view
                ><text>{{ game.title }}</text
                ><text>{{ game.subtitle }}</text
                ><view
                  ><text>{{ game.duration }}</text
                  ><text v-if="game.arSupported">AR互动</text></view
                >
              </button></view
            >
            <view
              v-if="selfSelectedGame"
              class="self-selected-card"
              data-testid="selected-self-exercise"
              ><view
                ><text>自选运动</text
                ><text>{{ mode === "cardiac" ? "非医院处方" : "已选择" }}</text></view
              ><text>{{ selfSelectedGame.title }}</text
              ><text
                >{{ selfSelectedGame.subtitle }} ·
                {{ selfSelectedGame.duration }}</text
              ><text>{{
                mode === "cardiac"
                  ? "不影响医生今日计划"
                  : "准备好后即可开始运动"
              }}</text
              ><button data-testid="start-self-exercise" @tap="startSelfSelected">
                {{ mode === "public" ? "开始运动" : "开始自选运动" }}
              </button></view
            >
                  </view>
                </scroll-view>
              </swiper-item>
              <swiper-item>
                <scroll-view
                  class="today-page-scroll"
                  scroll-y
                  :scroll-top="gardenScrollTop"
                >
                  <view
                    class="today-garden-page"
                    data-testid="today-garden-page"
                  >
                    <RehabGardenPanel :garden="gardenViewState" />
                    <view
                      class="garden-checkin-panel"
                      data-testid="garden-checkin-panel"
                    >
                      <view class="garden-checkin-heading">
                        <view>
                          <text>打卡记录</text>
                          <text>有效运动完成后自动记录，每天最多一次</text>
                        </view>
                      </view>
                      <view
                        class="checkin-hero"
                        data-testid="garden-checkin-summary"
                      >
                        <view>
                          <text>{{
                            checkInDone
                              ? "今天已自动打卡"
                              : "完成一次有效运动后自动打卡"
                          }}</text>
                          <text
                            >连续 {{ streak }} 天 · 累计
                            {{ totalCheckInDays }} 天</text
                          >
                        </view>
                        <text>{{ checkInDone ? "✓" : streak }}</text>
                      </view>
                      <view
                        class="calendar-card"
                        data-testid="garden-checkin-calendar"
                      >
                        <view class="calendar-heading"
                          ><button @tap="shiftCalendarMonth(-1)">‹</button
                          ><text>{{ calendarTitle }}</text
                          ><button
                            :disabled="!canGoNextMonth"
                            @tap="shiftCalendarMonth(1)"
                          >
                            ›
                          </button></view
                        >
                        <view class="calendar-week"
                          ><text
                            v-for="day in ['一', '二', '三', '四', '五', '六', '日']"
                            :key="day"
                            >{{ day }}</text
                          ></view
                        >
                        <view class="calendar-grid"
                          ><view
                            v-for="item in calendarCells"
                            :key="item.key"
                            :class="{
                              blank: item.blank,
                              done: item.checked,
                              today: item.today,
                              future: item.future,
                            }"
                            ><text v-if="!item.blank">{{ item.day }}</text
                            ><image
                              v-if="item.checked"
                              src="/static/icons/cabbage-checkin.svg"
                              mode="aspectFit" /></view></view
                        >
                      </view>
                    </view>
                  </view>
                </scroll-view>
              </swiper-item>
            </swiper>
          </view>

          <view
            v-else-if="activeNav === 'discover'"
            class="discover-screen"
            data-testid="discover-screen"
          >
            <CompanionHub
              entry-only
              disabled
              v-model:active-tab="socialTab"
              :streak="streak"
              :team-joined="teamJoined"
              :team-state="teamState"
              :team-members="teamMembers"
              :team-checked-count="teamCheckedCount"
              :team-progress="teamProgress"
              :buddy-state="buddyState"
              :buddy-day="buddyDay"
              :check-in-done="checkInDone"
              :today-key="todayKey()"
              @open-social="openSocial"
            />
            <KnowledgeHub
              :mode="mode"
              :items="knowledgeItems"
              @open="openKnowledgeItem"
            />
          </view>

          <AssistantPanel
            v-else-if="activeNav === 'assistant'"
            class="screen"
            :mode="mode"
            :display-name="displayName"
            :mascot="magpieAsset"
            :completed-count="completedExerciseCount"
            :streak="streak"
            :plan-title="featuredGame.title + ' ' + featuredGame.duration"
            :plan-completed="taskCompleted"
            :latest-advice="latestAdvice"
            @start-plan="selectExercise(featuredGame.id)"
            @open-reports="openLatestReport"
            @open-devices="goDetail('devices')"
            @open-profile="goDetail('health-archive')"
          />

          <view
            v-else-if="activeNav === 'data'"
            class="screen data-screen"
            data-testid="data-screen"
          >
            <view class="data-panel">
              <view class="today-numbers"
                ><view
                  ><text>{{ totalMinutes }}</text
                  ><text>运动时间</text></view
                ><view
                  ><text>{{ totalCompletedSessions }}</text
                  ><text>完成项目</text></view
                ><view
                  ><text>{{ streak }}</text
                  ><text>连续天数</text></view
                ></view
              >
              <button
                v-if="latestAdvice"
                class="latest-advice"
                :class="'level-' + latestAdvice.level"
                @tap="openLatestReport"
              >
                <view
                  ><text>最新解读</text><text>{{ latestAdvice.title }}</text
                  ><text>{{ latestAdvice.summary }}</text></view
                ><text>›</text>
              </button>
              <view v-else class="empty-card"
                >完成一次运动后，小喜会在这里显示简短解读。</view
              >
              <view class="section-heading"
                ><view
                  ><text>身体数据</text
                  ><text>缺失与过期不会显示为正常</text></view
                ><button @tap="goDetail('devices')">数据来源 ›</button></view
              >
              <view class="metric-row"
                ><view v-for="metric in visibleMetrics" :key="metric.label"
                  ><text>{{ metric.label }}</text
                  ><text
                    >{{ metric.value
                    }}<text class="metric-unit">{{ metric.unit }}</text></text
                  ><text>{{ metric.source }}</text></view
                ></view
              >
              <view class="section-heading daily-activity-heading"
                ><view
                  ><text>每日活动</text
                  ><text>步数独立于训练前后安全评估</text></view
                ><button @tap="goDetail('devices')">录入与来源 ›</button></view
              >
              <button
                class="daily-steps-card"
                data-testid="daily-steps-card"
                @tap="goDetail('devices')"
              >
                <view>
                  <text>今日步数</text>
                  <text v-if="validTodayStepRecord"
                    >{{ formatSteps(validTodayStepRecord.steps)
                    }}<text> 步</text></text
                  >
                  <text v-else>未同步</text>
                  <text
                    >目标 {{ formatSteps(DAILY_STEP_GOAL) }} 步（演示目标）</text
                  >
                </view>
                <view class="daily-steps-card__status">
                  <text>{{ todayStepProgress }}%</text>
                  <text v-if="validTodayStepRecord">{{
                    sourceLabel(validTodayStepRecord.source)
                  }}</text>
                  <text v-else>去同步 ›</text>
                </view>
              </button>
              <view class="steps-trend-card" data-testid="steps-trend">
                <view class="steps-trend-card__head">
                  <view>
                    <text>近7日步数趋势</text>
                    <text>按自然日统计 · 今日高亮</text>
                  </view>
                  <text>目标 {{ formatSteps(DAILY_STEP_GOAL) }}</text>
                </view>
                <view class="steps-trend-chart">
                  <view
                    v-for="item in sevenDayStepTrend"
                    :key="item.key"
                    :class="{ today: item.today, missing: item.steps === undefined }"
                  >
                    <text>{{
                      item.steps === undefined ? "—" : formatCompactSteps(item.steps)
                    }}</text>
                    <view class="steps-trend-rail"
                      ><view
                        :style="{ height: stepBarHeight(item.steps) + '%' }"
                      /></view
                    ><text>{{ item.label }}</text>
                  </view>
                </view>
                <text v-if="validStepTrendDays < 2" class="steps-trend-empty"
                  >有效日期少于2天，暂不足以形成趋势判断。</text
                >
              </view>
              <view class="section-heading"
                ><view
                  ><text>近7次运动</text><text>日期、开始时间与时长</text></view
                ></view
              ><view class="recent-session-list"
                ><view v-for="session in recentSessions" :key="session.id"
                  ><view
                    ><text>{{ session.title }}</text
                    ><text>{{
                      compactSessionDate(session.createdAt)
                    }}</text></view
                  ><text>{{
                    formatDuration(session.durationSeconds)
                  }}</text></view
                ><text v-if="!recentSessions.length">还没有完成记录</text></view
              >
            </view>
          </view>

          <view
            v-else
            class="screen profile-screen"
            data-testid="profile-screen"
          >
            <view class="profile-identity"
              ><view class="profile-avatar">{{ displayName.slice(0, 1) }}</view
              ><text>{{
                mode === "cardiac"
                  ? sharedPatientFixture.patient.name
                  : displayName
              }}</text
              ><text>{{
                mode === "cardiac"
                  ? sharedPatientFixture.hospital.shortName +
                    " · " +
                    sharedPatientFixture.patient.patientNo
                  : "日常运动用户"
              }}</text
              ><button @tap="goDetail('health-archive')">
                查看健康档案
              </button></view
            >
            <view class="profile-checkins"
              ><button @tap="openGardenCheckIn">
                <text>{{ totalCheckInDays }}</text
                ><text>累计打卡</text></button
              ><button @tap="openGardenCheckIn">
                <text>{{ streak }}</text
                ><text>连续打卡</text>
              </button></view
            >
            <view class="profile-section"
              ><text>健康管理</text
              ><view class="service-grid health-management-grid"
                ><button @tap="goDetail('devices')">
                  <view
                    ><AppIcon
                      src="/static/icons/magpie-line/device.svg"
                      :size="36" /></view
                  ><text>设备授权</text
                  ><text>{{
                    deviceConnected ? "已连接" : "去管理"
                  }}</text></button
                ><button @tap="goDetail('health-archive')">
                  <view
                    ><AppIcon
                      src="/static/icons/magpie-line/archive.svg"
                      :size="36" /></view
                  ><text>健康档案</text><text>目标与来源</text></button
                ><button @tap="openTrainingReports">
                  <view
                    ><AppIcon
                      src="/static/icons/magpie-line/report.svg"
                      :size="36" /></view
                  ><text>训练报告</text><text>单次与阶段</text></button
                ><button
                  class="service-disabled"
                  disabled
                  aria-disabled="true"
                  data-testid="points-exchange-unavailable"
                >
                  <view
                    ><AppIcon
                      src="/static/icons/magpie-line/badge.svg"
                      :size="36" /></view
                  ><text>积分兑换</text><text>暂未开放</text>
                </button></view
              ></view
            >
            <view class="profile-section"
              ><text>原型设置</text
              ><view class="service-list"
                ><button @tap="goDetail('prototype-policy')">
                  <AppIcon
                    src="/static/icons/magpie-line/safety.svg"
                    :size="34"
                  /><view
                    ><text>训练状态策略</text
                    ><text>患者策略 v{{ publishedPolicy.version }}</text></view
                  ><text>›</text></button
                ><button @tap="goDetail('doctor-reviews')">
                  <AppIcon
                    src="/static/icons/magpie-line/report.svg"
                    :size="34"
                  /><view
                    ><text>医生审核队列</text
                    ><text>{{ pendingReviewCount }} 条待处理</text></view
                  ><text>›</text>
                </button></view
              ></view
            >
            <view class="profile-actions"
              ><button @tap="switchMode">切换使用模式</button
              ><button @tap="showAiBoundary = true">隐私与医疗边界</button
              ><button @tap="resetPrototype">重置原型</button></view
            >
          </view>
        </scroll-view>
        <view class="bottom-nav"
          ><button
            v-for="item in navItems"
            :key="item.id"
            :class="{ active: activeNav === item.id }"
            @tap="switchNav(item.id)"
          >
            <view
              ><AppIcon
                :src="item.iconPath"
                :size="42"
                :active="activeNav === item.id"
                :color="activeNav === item.id ? '#0EA5A4' : '#64748B'" /></view
            ><text>{{ item.label }}</text>
          </button></view
        >
      </view>

      <view v-else class="detail-frame" :data-detail-view="detailView">
        <view class="detail-header"
          ><button @tap="closeDetail">‹</button><text>{{ detailTitle }}</text
          ><button @tap="showAiBoundary = true">?</button></view
        >
        <scroll-view class="detail-scroll" scroll-y>
          <view v-if="detailView === 'weekly-path'" class="detail-content"
            ><DetailIntro
              kicker="本周运动路径"
              title="一天一个小节点"
              copy="普通中断不扣分、不清空计划。"
            /><view class="path-list"
              ><button
                v-for="day in weeklyPlanDays"
                :key="day.label"
                :class="{ done: day.done, today: day.today }"
                @tap="day.today && selectExercise(day.gameId)"
              >
                <text>{{ day.done ? "✓" : day.index }}</text
                ><view
                  ><text>周{{ day.label }} · {{ day.game.title }}</text
                  ><text
                    >{{ day.game.duration }} ·
                    {{
                      day.today ? "今天" : day.done ? "已完成" : "待开始"
                    }}</text
                  ></view
                ><text>{{ day.today ? "开始 ›" : "" }}</text>
              </button></view
            ></view
          >

          <view
            v-else-if="detailView === 'exercise-category'"
            class="detail-content"
            ><DetailIntro
              kicker="运动分类"
              :title="selectedCategory.title"
              :copy="selectedCategory.description"
            /><view class="category-recommend"
              ><view class="category-recommend__icon"
                ><AppIcon
                  :src="categoryRecommendedGame.iconPath"
                  :size="72"
                  color="#0F766E" /></view
              ><view
                ><text>今日推荐</text
                ><text>{{ categoryRecommendedGame.title }}</text
                ><text>{{ categoryRecommendedGame.subtitle }}</text
                ><button @tap="selectExercise(categoryRecommendedGame.id)">
                  开始 {{ categoryRecommendedGame.duration }}
                </button></view
              ></view
            ><view class="simple-exercise-list"
              ><button
                v-for="game in categoryGames"
                :key="game.id"
                @tap="selectExercise(game.id)"
              >
                <view
                  ><text>{{ game.title }}</text
                  ><text
                    >{{ game.feature
                    }}<text v-if="game.arSupported"> · AR互动</text></text
                  ></view
                ><text>{{ game.duration }} ›</text>
              </button></view
            ></view
          >

          <view
            v-else-if="detailView === 'precheck'"
            class="detail-content"
            data-testid="precheck-screen"
            ><StepIndicator :current="1" />
            <view class="precheck-heading">
              <text>训练前确认</text>
              <text>完成以下信息后即可开始 · 约30秒</text>
              <text
                >医院安全规则 v{{ publishedPolicy.version }} ·
                训练前{{ modeLabel(publishedPolicy.preMode) }}</text
              >
            </view>
            <view class="precheck-section" data-testid="discomfort-score">
              <view class="precheck-section__title">
                <text>1</text>
                <view>
                  <text>当前不适程度</text>
                  <text>0代表没有不适，10代表非常不适</text>
                </view>
                <text>{{ preSnapshot.discomfortScore ?? "待填写" }}</text>
              </view>
              <slider
                :value="preSnapshot.discomfortScore ?? 0"
                min="0"
                max="10"
                step="1"
                activeColor="#11866F"
                backgroundColor="#dce8e4"
                @changing="setPreDiscomfortScore"
                @change="setPreDiscomfortScore"
              />
              <view class="discomfort-scale">
                <text>0 无不适</text>
                <text>1–3 轻微</text>
                <text>4–6 明显</text>
                <text>7–10 严重</text>
              </view>
            </view>
            <button
              class="precheck-danger-entry"
              data-testid="precheck-danger-entry"
              @tap="reportPrecheckDiscomfort"
            >
              <view>
                <text>有胸痛、明显气促、头晕或心悸？</text>
                <text>出现明显不适时，不要继续运动。</text>
              </view>
              <text>我有明显不适，暂不开始</text>
            </button>
            <view class="precheck-section" data-testid="precheck-vitals">
              <view class="precheck-section__title">
                <text>2</text>
                <view>
                  <text>血压和血氧</text>
                  <text>选择设备读取，或使用家中设备后手动填写</text>
                </view>
              </view>
              <view class="vital-entry-modes">
                <button
                  :class="{ active: preVitalInputMode === 'device' }"
                  data-testid="read-pre-vitals"
                  @tap="readPreVitalsFromDevice"
                >
                  设备自动读取
                </button>
                <button
                  :class="{ active: preVitalInputMode === 'manual' }"
                  data-testid="enter-pre-vitals-manually"
                  @tap="chooseManualPreVitals"
                >
                  手动填写
                </button>
              </view>
              <text v-if="preVitalInputMode === 'none'" class="precheck-empty"
                >尚未测量，请选择一种方式。</text
              >
              <view v-else class="vital-form precheck-vital-form">
                <label>
                  <text>收缩压</text>
                  <view>
                    <input
                      :value="preSnapshot.systolicBloodPressure ?? ''"
                      type="number"
                      placeholder="待填"
                      :disabled="preVitalInputMode !== 'manual'"
                      @input="
                        setManualPreVital('systolicBloodPressure', $event)
                      "
                    />
                    <text>mmHg</text>
                  </view>
                </label>
                <label>
                  <text>舒张压</text>
                  <view>
                    <input
                      :value="preSnapshot.diastolicBloodPressure ?? ''"
                      type="number"
                      placeholder="待填"
                      :disabled="preVitalInputMode !== 'manual'"
                      @input="
                        setManualPreVital('diastolicBloodPressure', $event)
                      "
                    />
                    <text>mmHg</text>
                  </view>
                </label>
                <label>
                  <text>血氧</text>
                  <view>
                    <input
                      :value="preSnapshot.oxygenSaturation ?? ''"
                      type="number"
                      placeholder="待填"
                      :disabled="preVitalInputMode !== 'manual'"
                      @input="setManualPreVital('oxygenSaturation', $event)"
                    />
                    <text>%</text>
                  </view>
                </label>
              </view>
              <text
                v-if="preVitalInputMode !== 'none'"
                class="precheck-source-note"
                :class="{ ready: preSnapshot.quality === 'valid' }"
                >数据来源：{{ sourceLabel(preSnapshot.source) }} ·
                {{ qualityLabel(preSnapshot.quality) }} ·
                {{ formatTime(preSnapshot.measuredAt) }}</text
              >
              <text
                v-if="
                  preVitalInputMode === 'manual' &&
                  preSnapshot.quality !== 'valid'
                "
                class="precheck-empty"
                >请完整填写收缩压、舒张压和血氧。</text
              >
            </view>
            <button
              class="primary-button"
              :disabled="publishedPolicy.preMode === 'required' && !preReady"
              data-testid="begin-training"
              @tap="startTraining"
            >
              确认并开始运动</button
            ><button
              v-if="publishedPolicy.preMode === 'optional'"
              class="text-button"
              @tap="skipPre"
            >
              跳过本次记录
            </button></view
          >

          <view
            v-else-if="detailView === 'training'"
            class="detail-content training-detail"
            data-testid="training-screen"
            ><view class="training-strip training-strip--compact"
              ><text class="training-state">{{
                trainingStatus === "paused" ? "已暂停" : "训练中"
              }}</text
              ><view v-if="showLiveVitals" class="live-vitals-inline" data-testid="live-vitals"
                ><text>♥ {{ liveHeartRate }} <text>bpm</text></text
                ><text>SpO₂ {{ liveOxygen }}%</text
                ><text>手环</text></view
              ><view class="training-timer"
                ><text>{{ formattedElapsed }}</text
                ><text>/ {{ formatTimer(trainingTargetSeconds) }}</text></view
              ></view
            ><TrainingExperience
              :game="selectedGame"
              :activity="todayActivity"
              :paused="trainingStatus === 'paused'"
              :rep-count="repCount"
              :rhythm-hits="rhythmHits"
              :rhythm-combo="rhythmCombo"
              :rhythm-round="rhythmRound"
              :elapsed="elapsed"
              :target-seconds="trainingTargetSeconds"
              @camera-status="cameraStatus = $event"
              @course-time="syncCourseElapsed"
              @course-ended="finishTraining(false)"
              @rep="recordRep"
              @beat="recordBeat"
            /><view class="exercise-controls"
              ><button @tap="toggleTraining">
                {{ trainingStatus === "paused" ? "继续" : "暂停" }}</button
              ><button class="danger-button" @tap="showStopReason = true">
                我有不适
              </button></view
            ><button
              class="primary-button"
              data-testid="demo-complete"
              @tap="finishTraining(true)"
            >
              快速完成演示</button
            ><button class="text-button" @tap="finishTraining(false)">
              结束本次运动
            </button></view
          >

          <view
            v-else-if="detailView === 'postcheck'"
            class="detail-content"
            data-testid="postcheck-screen"
            ><StepIndicator :current="3" /><view class="policy-banner"
              ><view
                ><text>{{
                  trainingStatus === "stopped" ? "训练已停止" : "缓和后记录"
                }}</text
                ><text
                  >训练后{{ modeLabel(publishedPolicy.postMode) }} ·
                  3–5分钟恢复数据</text
                ></view
              ><button @tap="simulateVitalSync('post')">重新同步</button></view
            ><view
              class="vital-source"
              :class="'quality-' + postSnapshot.quality"
              ><view
                ><AppIcon
                  src="/static/icons/magpie-line/device.svg"
                  :size="34"
                /><view
                  ><text>{{ sourceLabel(postSnapshot.source) }}</text
                  ><text
                    >{{ qualityLabel(postSnapshot.quality) }} ·
                    {{ formatTime(postSnapshot.measuredAt) }}</text
                  ></view
                ></view
              ><text>{{
                postSnapshot.quality === "valid" ? "已同步" : "待补充"
              }}</text></view
            ><view class="vital-form"
              ><label v-if="publishedPolicy.fields.heartRate"
                ><text>心率</text
                ><view
                  ><input
                    v-model.number="postSnapshot.heartRate"
                    type="number"
                  /><text>次/分</text></view
                ></label
              ><label v-if="publishedPolicy.fields.oxygenSaturation"
                ><text>血氧</text
                ><view
                  ><input
                    v-model.number="postSnapshot.oxygenSaturation"
                    type="number"
                  /><text>%</text></view
                ></label
              ></view
            ><button
              v-if="postSnapshot.quality !== 'valid'"
              class="text-button"
              @tap="useManualSnapshot('post')"
            >
              标记为外部设备读数</button
            ><view v-if="publishedPolicy.fields.borg" class="form-card"
              ><text class="form-title">Borg用力感 {{ postSnapshot.borg }}</text
              ><slider
                :value="postSnapshot.borg"
                min="0"
                max="10"
                activeColor="#11866F"
                @change="setSnapshotBorg('post', $event)" /></view
            ><view v-if="publishedPolicy.fields.feeling" class="form-card"
              ><text class="form-title">运动后感受</text
              ><view class="feeling-row"
                ><button
                  v-for="feeling in ['轻松', '适中', '较累']"
                  :key="feeling"
                  :class="{ active: postSnapshot.feeling === feeling }"
                  @tap="setPostFeeling(feeling)"
                >
                  {{ feeling }}
                </button></view
              ></view
            ><button
              class="primary-button"
              data-testid="generate-report"
              @tap="generateReport"
            >
              {{ postReady ? "生成运动解读" : "保存记录并查看提示" }}</button
            ><button
              v-if="publishedPolicy.postMode === 'optional'"
              class="text-button"
              @tap="skipPost"
            >
              跳过本次记录
            </button></view
          >

          <view
            v-else-if="detailView === 'session-report'"
            class="detail-content"
            data-testid="session-report-screen"
            ><view
              v-if="selectedSession"
              class="session-summary"
              :class="{ stopped: selectedSession.status === 'stopped' }"
              ><view>{{
                selectedSession.status === "stopped"
                  ? "停"
                  : selectedSession.poseScored
                    ? selectedSession.score
                    : "完"
              }}</view
              ><text>{{
                selectedSession.status === "stopped"
                  ? "本次运动已停止并记录"
                  : selectedSession.title + "完成"
              }}</text
              ><text
                >{{ formatDuration(selectedSession.durationSeconds) }} ·
                {{
                  selectedSession.pointsAwarded
                    ? "+" + selectedSession.pointsAwarded + "积分"
                    : "未新增积分"
                }}</text
              ></view
            ><view
              v-if="
                selectedSession?.status === 'completed' &&
                pendingGardenFeedback &&
                pendingGardenFeedback.sessionId === selectedSession.id
              "
              class="garden-growth-feedback"
              :class="{ harvested: pendingGardenFeedback.harvested }"
              data-testid="garden-growth-feedback"
              data-state="success"
            >
              <image
                src="/static/icons/cabbage-checkin.svg"
                mode="aspectFit"
              />
              <view>
                <text>{{
                  pendingGardenFeedback.harvested
                    ? `恭喜收获第${pendingGardenFeedback.harvestCount}棵小白菜`
                    : "训练完成，小白菜长大啦"
                }}</text>
                <text v-if="pendingGardenFeedback.harvested"
                  >本轮成长已达到第7/7天，下一轮将从第0/7天开始。</text
                >
                <text v-else
                  >成长进度：第{{ pendingGardenFeedback.beforeDay }}/7天 →
                  第{{ pendingGardenFeedback.afterDay }}/7天</text
                >
              </view>
            </view
            ><view v-if="selectedSession?.assessment" class="comparison-card"
              ><text class="form-title">训练前后变化</text
              ><view
                ><text>训练前</text
                ><text>{{
                  snapshotSummary(selectedSession.assessment.pre)
                }}</text></view
              ><view
                ><text>训练后</text
                ><text>{{
                  snapshotSummary(selectedSession.assessment.post)
                }}</text></view
              ><text>{{ selectedSession.assessment.comparison }}</text></view
            ><view
              v-if="selectedSession?.advice"
              class="advice-card"
              :class="'level-' + selectedSession.advice.level"
              ><view class="advice-heading"
                ><view
                  ><text>小喜解读</text
                  ><text>{{ selectedSession.advice.title }}</text></view
                ><text>{{
                  adviceLevelLabel(selectedSession.advice.level)
                }}</text></view
              ><text class="advice-summary">{{
                selectedSession.advice.summary
              }}</text
              ><view class="advice-list"
                ><text>判断依据</text
                ><view
                  v-for="item in selectedSession.advice.evidence"
                  :key="item"
                  >· {{ item }}</view
                ></view
              ><view class="advice-list"
                ><text>下一步</text
                ><view
                  v-for="item in selectedSession.advice.actions"
                  :key="item"
                  >· {{ item }}</view
                ></view
              ><text class="advice-source">{{
                selectedSession.advice.sourceSummary
              }}</text
              ><text class="advice-boundary">{{
                selectedSession.advice.boundary
              }}</text></view
            ><view
              v-if="
                selectedSession?.advice &&
                reviewForAdvice(selectedSession.advice.id)
              "
              class="review-status"
              ><text>医生审核</text
              ><text>{{
                reviewStatusLabel(
                  reviewForAdvice(selectedSession.advice.id)!.status,
                )
              }}</text></view
            ><button class="primary-button" @tap="closeDetail">
              完成
            </button></view
          >

          <TrainingReports
            v-else-if="detailView === 'training-reports'"
            class="detail-content training-reports-detail"
            :sessions="sessions"
            :prescription-items="sharedPatientFixture.prescription.items"
            :prescription-version="sharedPatientFixture.prescription.version"
          />

          <view v-else-if="detailView === 'social-hub'" class="detail-content"
            ><DetailIntro
              kicker="温和陪伴"
              title="一起坚持，不比较身体数据"
              copy="申请、配对和提醒均为本地演示，不会发送真实消息。" /><CompanionHub
              v-model:active-tab="socialTab"
              :streak="streak"
              :team-joined="teamJoined"
              :team-state="teamState"
              :team-members="teamMembers"
              :team-checked-count="teamCheckedCount"
              :team-progress="teamProgress"
              :buddy-state="buddyState"
              :buddy-day="buddyDay"
              :check-in-done="checkInDone"
              :today-key="todayKey()"
              @create-team="createDemoTeam"
              @join-team="joinTeamByCode"
              @join-demo-team="applyDemoTeam"
              @remind-team="remindTeamMember"
              @set-buddy-cycle="setBuddyCycle"
              @connect-buddy="applyDemoBuddy"
              @remind-buddy="remindBuddy"
          /></view>

          <view v-else-if="detailView === 'devices'" class="detail-content"
            ><DetailIntro
              kicker="数据来源"
              title="设备与授权"
              copy="手机负责授权和汇总，不被描述为血氧仪。"
            /><view class="device-platforms"
              ><button
                v-for="source in deviceSources"
                :key="source.id"
                @tap="simulateDeviceConnect(source.id)"
              >
                <view
                  ><text>{{ source.icon }}</text
                  ><view
                    ><text>{{ source.name }}</text
                    ><text>{{ source.copy }}</text></view
                  ></view
                ><text>{{
                  validTodayStepRecord?.source === source.id
                    ? "今日已同步"
                    : "去授权"
                }}</text>
              </button></view
            ><view class="manual-steps-card" data-testid="manual-steps-card"
              ><view class="manual-steps-card__head"
                ><view
                  ><text>手动补录今日步数</text
                  ><text>目标 6,000 步（演示目标，不是医生运动处方）</text></view
                ><text v-if="validTodayStepRecord">{{
                  sourceLabel(validTodayStepRecord.source)
                }}</text></view
              >
              <view v-if="validTodayStepRecord" class="manual-steps-current"
                ><text>今日记录</text
                ><text
                  >{{ formatSteps(validTodayStepRecord.steps) }} 步 ·
                  {{ formatStepSyncedTime(validTodayStepRecord.syncedAt) }}</text
                ></view
              >
              <view class="manual-steps-entry"
                ><input
                  v-model="manualStepsInput"
                  data-testid="manual-steps-input"
                  type="number"
                  maxlength="6"
                  placeholder="请输入 0–100000 的整数"
                  :disabled="hasValidDeviceSteps"
                /><text>步</text
                ><button
                  data-testid="save-manual-steps"
                  :disabled="hasValidDeviceSteps"
                  @tap="saveManualSteps"
                >
                  保存
                </button></view
              >
              <text class="manual-steps-note">{{
                hasValidDeviceSteps
                  ? "设备数据已同步，手动补录已停用；再次设备同步会更新今日记录。"
                  : "无有效设备数据时可补录；设备同步后将优先使用设备数据。"
              }}</text></view
            ><view class="privacy-card"
              ><text>原型说明</text
              ><text
                >App正式接入时按数据类型单独授权；H5和小程序使用模拟设备适配器，不读取真实健康数据。</text
              ></view
            ></view
          >

          <view
            v-else-if="detailView === 'health-archive'"
            class="detail-content archive-detail"
            ><DetailIntro
              kicker="我的健康档案"
              :title="
                mode === 'cardiac'
                  ? '确认身份、医生计划和数据来源'
                  : '管理少量个人信息和健康目标'
              "
              :copy="
                mode === 'cardiac'
                  ? '医疗字段只读；个人目标和设备授权由你管理。'
                  : '只保存姓名、年龄和健康目标，不收集不必要的信息。'
              "
            /><view
              v-if="mode === 'public'"
              class="archive-card public-profile-form"
              data-testid="public-profile-form"
            >
              <text class="form-title">个人信息</text>
              <label class="public-profile-field">
                <text>姓名</text>
                <input
                  v-model="publicProfileDraft.name"
                  data-testid="public-profile-name"
                  maxlength="20"
                  placeholder="请输入姓名"
                />
                <text v-if="publicProfileErrors.name" class="field-error">{{
                  publicProfileErrors.name
                }}</text>
              </label>
              <label class="public-profile-field">
                <text>年龄</text>
                <view>
                  <input
                    v-model="publicProfileDraft.age"
                    data-testid="public-profile-age"
                    type="number"
                    maxlength="3"
                    placeholder="18–100"
                  />
                  <text>岁</text>
                </view>
                <text v-if="publicProfileErrors.age" class="field-error">{{
                  publicProfileErrors.age
                }}</text>
              </label>
              <button
                class="archive-action"
                data-testid="public-profile-save"
                @tap="savePublicProfile"
              >
                保存个人信息
              </button>
            </view
            ><view v-if="mode === 'cardiac'" class="archive-card"
              ><text class="form-title">我的健康身份</text
              ><view class="source-row"
                ><text>姓名</text
                ><text>{{
                  sharedPatientFixture.patient.maskedName
                }}</text></view
              ><view class="source-row"
                ><text>康复阶段</text
                ><text>{{
                  sharedPatientFixture.patient.rehabStage
                }}</text></view
              ><view class="source-row"
                ><text>风险分层</text
                ><text>{{ sharedPatientFixture.patient.riskLevel }}</text></view
              ><text class="archive-copy">{{
                sharedPatientFixture.patient.diagnosis
              }}</text></view
            ><view v-if="mode === 'cardiac'" class="archive-card"
              ><text class="form-title">当前康复计划</text
              ><view class="source-row"
                ><text>医院与医生</text
                ><text
                  >{{ sharedPatientFixture.hospital.shortName }} ·
                  {{ sharedPatientFixture.patient.assignedDoctor }}</text
                ></view
              ><view class="source-row"
                ><text>处方版本</text
                ><text
                  >{{ sharedPatientFixture.prescription.prescriptionNo }} ·
                  {{ sharedPatientFixture.prescription.version }}</text
                ></view
              ><view class="archive-prescriptions"
                ><text
                  v-for="item in sharedPatientFixture.prescription.items"
                  :key="item.project"
                  >{{ item.project }} · {{ item.duration }}</text
                ></view
              ><button
                class="archive-action"
                @tap="
                  activeNav = 'today';
                  closeDetail();
                "
              >
                查看当前处方
              </button></view
            ><view class="archive-card"
              ><text class="form-title">身体数据来源</text>
              <view class="source-row">
                <text>运动记录</text
                ><text>本机原型 · {{ sessions.length }}条</text>
              </view>
              <view class="source-row">
                <text>设备授权</text
                ><text>{{
                  deviceConnected ? "模拟设备 · 已授权" : "未授权"
                }}</text>
              </view>
              <button class="archive-action" @tap="goDetail('devices')">
                管理设备授权
              </button></view
            ><view class="archive-card"
              ><text class="form-title">我的健康目标</text
              ><text class="archive-copy">{{ healthGoalLabel }}</text
              ><view class="goal-row"
                ><button
                  :class="{ active: healthGoal === 'habit' }"
                  @tap="setHealthGoal('habit')"
                >
                  运动习惯</button
                ><button
                  :class="{ active: healthGoal === 'weight' }"
                  @tap="setHealthGoal('weight')"
                >
                  健康减重</button
                ><button
                  v-if="mode === 'cardiac'"
                  :class="{ active: healthGoal === 'cardiac' }"
                  @tap="setHealthGoal('cardiac')"
                >
                  康复计划
                </button></view
              ></view
            ><view class="privacy-card"
              ><text>数据用途与隐私</text
              ><text
                >数据仅用于本地训练记录、报告和小喜规则化解读；身体数值不参与积分或社交排名。</text
              ></view
            ></view
          >

          <view
            v-else-if="detailView === 'reward-store'"
            class="detail-content reward-station"
            ><view class="points-hero"
              ><text>元气任务派送站</text><text>{{ wallet.healthPoints }}</text
              ><text>健康积分可用</text
              ><view
                ><text>完成有效运动</text><text>自动打卡</text
                ><text>坚持7天</text></view
              ></view
            ><view class="points-task"
              ><text class="form-title">本周打卡任务</text
              ><view class="points-days"
                ><view
                  v-for="day in weeklyPlanDays"
                  :key="day.label"
                  :class="{ done: day.done }"
                  ><text>{{ day.done ? "✓" : day.label }}</text
                  ><text>{{ day.done ? "+5" : "待完成" }}</text></view
                ></view
              ></view
            ><button
              v-if="mem.unlocked"
              class="convert-button"
              :disabled="wallet.healthPoints < 100"
              @tap="convertPoints"
            >
              100健康积分 → 5M币</button
            ><view v-if="mem.unlocked" class="mem-challenge-rule"
              ><view><text>MEM八段锦7日奖励</text><text>连续 {{ memChallengeDays }}/7 天</text></view
              ><text>每天完整完成八式并产生动作评分，连续7天奖励20M币；快速演示和提前结束不计入。</text></view
            ><text class="store-title">积分礼品</text
            ><view class="reward-grid"
              ><view v-for="reward in visibleRewards" :key="reward.id"
                ><view>{{ reward.icon }}</view
                ><text>{{ reward.name }}</text
                ><text>{{ reward.description }}</text
                ><button
                  :disabled="!canRedeem(reward)"
                  @tap="confirmRedeem(reward)"
                >
                  {{ reward.cost
                  }}{{ reward.audience === "mem" ? "M币" : "积分" }}兑换
                </button></view
              ></view
            ><view v-if="redemptions.length" class="redemption-list"
              ><text class="form-title">兑换记录</text
              ><text v-for="record in redemptions" :key="record.id"
                >{{ record.rewardName }} · -{{ record.cost
                }}{{ record.currency === "m-coins" ? "M币" : "积分" }} ·
                已完成</text
              ></view
            ><text class="knowledge-boundary"
              >仅为本地积分兑换演示，不接人民币支付或积分充值。</text
            ></view
          >

          <view
            v-else-if="detailView === 'prototype-policy'"
            class="detail-content"
            data-testid="policy-console"
            ><DetailIntro
              kicker="本地原型配置台"
              title="训练状态策略"
              copy="普通用户固定关闭；配置仅作用于患者计划。"
            /><view class="policy-version"
              ><view
                ><text
                  >{{
                    policyDraft.status === "published" ? "已发布" : "草稿"
                  }}
                  v{{ policyDraft.version }}</text
                ><text>当前生效 v{{ publishedPolicy.version }}</text></view
              ><button @tap="publishPolicy">发布新版本</button></view
            ><view class="policy-phase"
              ><text>训练前状态</text
              ><view
                ><button
                  v-for="item in assessmentModes"
                  :key="item.id"
                  :class="{ active: policyDraft.preMode === item.id }"
                  @tap="setPolicyMode('pre', item.id)"
                >
                  {{ item.label }}
                </button></view
              ></view
            ><view class="policy-phase"
              ><text>训练后状态</text
              ><view
                ><button
                  v-for="item in assessmentModes"
                  :key="item.id"
                  :class="{ active: policyDraft.postMode === item.id }"
                  @tap="setPolicyMode('post', item.id)"
                >
                  {{ item.label }}
                </button></view
              ></view
            ><view class="policy-fields"
              ><text class="form-title">采集字段</text
              ><label v-for="field in policyFieldOptions" :key="field.id"
                ><view
                  ><text>{{ field.label }}</text
                  ><text>{{ field.copy }}</text></view
                ><switch
                  :checked="policyDraft.fields[field.id]"
                  color="#11866F"
                  @change="setPolicyField(field.id, $event)" /></label></view
            ><view class="policy-source"
              ><text class="form-title">来源优先级</text
              ><text
                >医院/直接设备 → Apple健康/Health Connect → 手动录入 →
                演示设备</text
              ></view
            ><view class="scenario-section"
              ><text class="form-title">一键生成演示数据</text
              ><view
                ><button @tap="seedScenario('stable')">稳定</button
                ><button @tap="seedScenario('attention')">需关注</button
                ><button @tap="seedScenario('stop')">危险症状</button
                ><button @tap="seedScenario('insufficient')">
                  数据不足
                </button></view
              ><text>仅写入小喜鹊本地原型。</text></view
            ></view
          >

          <view
            v-else-if="detailView === 'doctor-reviews'"
            class="detail-content"
            data-testid="doctor-review-console"
            ><DetailIntro
              kicker="本地医生工作台"
              title="建议审核"
              :copy="
                pendingReviewCount +
                ' 条建议等待确认，未经确认不会修改患者计划。'
              "
            /><view class="review-list"
              ><view v-for="review in doctorReviews" :key="review.id"
                ><view class="review-head"
                  ><view
                    ><text>{{
                      adviceForReview(review)?.title || "运动建议"
                    }}</text
                    ><text>{{ formatDateTime(review.createdAt) }}</text></view
                  ><text>{{ reviewStatusLabel(review.status) }}</text></view
                ><text>{{ review.proposedChange }}</text
                ><view v-if="review.status === 'pending'"
                  ><button @tap="resolveReview(review.id, 'approved')">
                    同意调整</button
                  ><button @tap="resolveReview(review.id, 'maintained')">
                    维持计划</button
                  ><button @tap="resolveReview(review.id, 'rejected')">
                    驳回
                  </button></view
                ></view
              ><view v-if="!doctorReviews.length" class="empty-card"
                >暂无待审核建议。</view
              ></view
            ></view
          >

          <view
            v-else-if="detailView === 'knowledge-article'"
            class="detail-content"
            ><view class="knowledge-detail-banner"
              ><view
                ><AppIcon
                  src="/static/icons/magpie-line/knowledge.svg"
                  :size="50"
                  color="#0F766E" /></view
              ><text>{{ selectedKnowledgeItem.duration }}</text></view
            ><DetailIntro
              kicker="精选指南"
              :title="selectedKnowledgeItem.title"
              :copy="selectedKnowledgeItem.summary"
            /><view class="article-body"
              ><text
                v-for="(paragraph, index) in selectedKnowledgeItem.body"
                :key="index"
                >{{ paragraph }}</text
              ></view
            ><text class="knowledge-boundary"
              >原型内容待医学审核，不替代医生诊断或处方。</text
            ></view
          >
          <view
            v-else-if="detailView === 'knowledge-video'"
            class="detail-content video-detail-content"
            ><video
              class="knowledge-video"
              :src="selectedKnowledgeItem.video"
              :poster="selectedKnowledgeItem.poster"
              :controls="true"
              :show-center-play-btn="true"
              object-fit="contain"
            /><view class="video-detail-body"
              ><DetailIntro
                kicker="健康短视频"
                :title="selectedKnowledgeItem.title"
                :copy="selectedKnowledgeItem.summary"
              /><text class="knowledge-boundary"
                >视频为原型素材，动作与内容待医学审核。</text
              ></view
            ></view
          >
        </scroll-view>
      </view>
    </template>

    <view v-if="showAiBoundary" class="modal-mask" @tap="showAiBoundary = false"
      ><view class="modal-card" @tap.stop
        ><text>健康助手边界</text
        ><text
          >小喜只提供健康教育、数据来源说明和规则化建议。它不能诊断疾病、调整药物或直接修改医院处方。</text
        ><button @tap="showAiBoundary = false">我知道了</button></view
      ></view
    >
    <view v-if="showStopReason" class="modal-mask"
      ><view class="modal-card danger-modal"
        ><text>哪里不舒服？</text><text>选择后立即停止，不会扣积分。</text
        ><button
          v-for="item in symptomOptions.slice(0, 3)"
          :key="item.value"
          @tap="stopTraining(item.label)"
        >
          {{ item.label }}</button
        ><button class="cancel" @tap="showStopReason = false">
          返回训练
        </button></view
      ></view
    >
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import AssistantPanel from "@/components/AssistantPanel.vue";
import CompanionHub from "@/components/CompanionHub.vue";
import DetailIntro from "@/components/DetailIntro.vue";
import KnowledgeHub from "@/components/KnowledgeHub.vue";
import RehabGardenPanel from "@/components/RehabGardenPanel.vue";
import StepIndicator from "@/components/StepIndicator.vue";
import TrainingExperience from "@/components/TrainingExperience.vue";
import TrainingReports from "@/components/TrainingReports.vue";
import { activities } from "@/lib/rive-motion";
import {
  isSupportedPatientNo,
  prescriptionItemGameId,
  prescriptionItemKey,
  sharedPatientFixture,
  type SharedPrescriptionItem,
} from "@/lib/shared-patient";
import {
  exerciseCategories,
  exerciseGames,
  knowledgeItems,
  navItems,
  patientMetrics,
  publicMetrics,
  rewardItems,
  type AdviceLevel,
  type AIAdvice,
  type AssessmentMode,
  type BuddyState,
  type CheckInRecord,
  type DailyStepRecord,
  type DataQuality,
  type DataSource,
  type DetailView,
  type DoctorReview,
  type ExerciseCategoryId,
  type ExerciseGameId,
  type MemEntitlement,
  type NavId,
  type RedemptionRecord,
  type ReviewStatus,
  type RewardItem,
  type RewardLedger,
  type TeamState,
  type TrainingAssessment,
  type TrainingAssessmentPolicy,
  type TrainingSession,
  type TrainingStatus,
  type UserMode,
  type VitalSnapshot,
  type WalletState,
} from "@/lib/prototype-data";

type OnboardingStep = "mode" | "binding";
type BindingState = "idle" | "loading" | "matched" | "error";
type HealthGoal = "habit" | "weight" | "cardiac";
type SocialTab = "none" | "team" | "buddy";
type ScenarioId = "stable" | "attention" | "stop" | "insufficient";
type TodayPageIndex = 0 | 1;
type PreVitalInputMode = "none" | "device" | "manual";
type PreVitalField =
  | "systolicBloodPressure"
  | "diastolicBloodPressure"
  | "oxygenSaturation";

interface GardenGrowthFeedback {
  sessionId: string;
  beforeDay: number;
  afterDay: number;
  harvested: boolean;
  harvestCount: number;
}

interface PublicHealthProfile {
  name: string;
  age: number | null;
}

const STORAGE_KEY = "magpie-prototype-state";
const DAILY_STEP_GOAL = 6000;
const GARDEN_CYCLE_LENGTH = 7;
const TODAY_PAGE_EXERCISE: TodayPageIndex = 0;
const TODAY_PAGE_GARDEN: TodayPageIndex = 1;
const magpieAsset =
  "/static/rive-source/v4/master/magpie-neutral-master-v4.png";
const appReady = ref(false);
const onboardingStep = ref<OnboardingStep>("mode");
const mode = ref<UserMode>("public");
const visitNumber = ref("");
const bindingState = ref<BindingState>("idle");
const activeNav = ref<NavId>("today");
const detailView = ref<DetailView>("none");
const detailReturnNav = ref<NavId>("today");
const healthGoal = ref<HealthGoal>("habit");
const socialTab = ref<SocialTab>("none");
const selectedCategoryId = ref<ExerciseCategoryId>("traditional");
const expandedCategoryId = ref<ExerciseCategoryId | "">("");
const selectedGameId = ref<ExerciseGameId>("baduanjin");
const selfSelectedGameId = ref<ExerciseGameId | "">("");
const activePrescriptionItemKey = ref("");
const todayPageIndex = ref<TodayPageIndex>(TODAY_PAGE_EXERCISE);
const exerciseScrollTop = ref(0);
const gardenScrollTop = ref(0);
const prescriptionSlide = ref(0);
const prescriptionGestureActive = ref(false);
const pendingGardenFeedback = ref<GardenGrowthFeedback | null>(null);
const selectedKnowledgeId = ref(knowledgeItems[0].id);
const selectedSessionId = ref("");
const trainingStatus = ref<TrainingStatus>("idle");
const elapsed = ref(0);
const repCount = ref(0);
const repStreak = ref(0);
const rhythmHits = ref(0);
const rhythmTotal = ref(0);
const rhythmCombo = ref(0);
const demoCompleted = ref(false);
const cameraStatus = ref<"idle" | "requesting" | "ready" | "denied">("idle");
const stoppedReason = ref("");
const pendingCheckInAward = ref(0);
const checkIns = ref<CheckInRecord[]>(buildSeedCheckIns());
const sessions = ref<TrainingSession[]>([]);
const teamState = ref<TeamState>(createDefaultTeamState());
const buddyState = ref<BuddyState>(createDefaultBuddyState());
const calendarMonth = ref(monthKey(new Date()));
const rewardLedger = ref<RewardLedger>({
  date: todayKey(),
  exerciseIds: [],
  prescriptionBonusAwarded: false,
});
const wallet = ref<WalletState>({ healthPoints: 160, mCoins: 0 });
const mem = ref<MemEntitlement>({ unlocked: false, inviteCode: "MEM-2026" });
const memCode = ref("");
const redemptions = ref<RedemptionRecord[]>([]);
const dailyStepRecords = ref<DailyStepRecord[]>(buildSeedDailySteps());
const manualStepsInput = ref("");
const deviceConnected = ref(false);
const liveHeartRate = ref(76);
const liveOxygen = ref(98);
const liveVitalUpdatedAt = ref("");
const doctorReviews = ref<DoctorReview[]>([]);
const planAdjustment = ref("");
const publicHealthProfile = ref<PublicHealthProfile>({
  name: "运动伙伴",
  age: null,
});
const publicProfileDraft = ref({ name: "运动伙伴", age: "" });
const publicProfileErrors = ref({ name: "", age: "" });
const showAiBoundary = ref(false);
const showStopReason = ref(false);
const preSnapshot = ref<VitalSnapshot>(createVitalSnapshot("pre"));
const postSnapshot = ref<VitalSnapshot>(createVitalSnapshot("post"));
const preVitalInputMode = ref<PreVitalInputMode>("none");
const policyDraft = ref<TrainingAssessmentPolicy>(createDefaultPolicy());
const publishedPolicy = ref<TrainingAssessmentPolicy>(createDefaultPolicy());
let trainingTimer: ReturnType<typeof setInterval> | undefined;

const assessmentModes: Array<{ id: AssessmentMode; label: string }> = [
  { id: "off", label: "关闭" },
  { id: "optional", label: "可选" },
  { id: "required", label: "必填" },
];
const policyFieldOptions: Array<{
  id: keyof TrainingAssessmentPolicy["fields"];
  label: string;
  copy: string;
}> = [
  { id: "heartRate", label: "心率", copy: "训练后由设备自动采集" },
  { id: "oxygenSaturation", label: "血氧", copy: "训练前设备读取或手动填写" },
  { id: "symptoms", label: "异常症状", copy: "训练前快捷上报" },
  { id: "borg", label: "Borg用力感", copy: "训练后0–10主观感受" },
  { id: "feeling", label: "运动后感受", copy: "轻松/适中/较累" },
  { id: "bloodPressure", label: "血压", copy: "训练前设备读取或手动填写" },
];
const symptomOptions = [
  { value: "chest-pain", label: "胸痛或胸部不适" },
  { value: "dyspnea", label: "明显气促或呼吸困难" },
  { value: "dizzy", label: "头晕或意识异常" },
  { value: "palpitation", label: "持续或明显心悸" },
];
const deviceSources = [
  {
    id: "apple-health",
    icon: "",
    name: "Apple健康",
    copy: "模拟同步步数、心率、血氧与运动记录",
  },
  {
    id: "health-connect",
    icon: "H",
    name: "Health Connect",
    copy: "模拟同步Android步数与健康数据",
  },
  {
    id: "demo-device",
    icon: "⌚",
    name: "智能手环 / 血氧仪",
    copy: "本地模拟步数与生命体征适配器",
  },
] as const;

const completedTodaySessions = computed(() =>
  sessions.value.filter(
    (item) =>
      item.status === "completed" &&
      (item.localDate || localDateKey(new Date(item.createdAt))) === todayKey(),
  ),
);
const prescriptionTasks = computed(() =>
  sharedPatientFixture.prescription.items
    .map((item, index) => {
      const key = prescriptionItemKey(item, index);
      const gameId = prescriptionItemGameId(item);
      const game = gameId
        ? exerciseGames.find((entry) => entry.id === gameId)
        : undefined;
      return {
        item,
        index,
        key,
        game,
        completed: completedTodaySessions.value.some(
          (session) => session.prescriptionItemKey === key,
        ),
      };
    }),
);
const firstPrescriptionGame = computed(
  () => prescriptionTasks.value.find((item) => item.game)?.game,
);
const publicRecommendedGameId = computed<ExerciseGameId>(() =>
  healthGoal.value === "weight" ? "walking" : "baduanjin",
);
const publicRecommendedGame = computed(
  () =>
    exerciseGames.find(
      (item) => item.id === publicRecommendedGameId.value,
    ) || exerciseGames[0],
);
const publicRecommendedCategory = computed(
  () =>
    exerciseCategories.find(
      (item) => item.id === publicRecommendedGame.value.categoryId,
    ) || exerciseCategories[0],
);
const publicRecommendationGoalLabel = computed(() =>
  healthGoal.value === "weight" ? "健康减重" : "运动习惯",
);
const publicTodayCompletedSessions = computed(() =>
  completedTodaySessions.value.filter((item) => item.mode === "public"),
);
const publicTodayCompleted = computed(
  () => publicTodayCompletedSessions.value.length > 0,
);
const publicCompletedMinutes = computed(() =>
  Math.round(
    publicTodayCompletedSessions.value.reduce(
      (sum, item) => sum + item.durationSeconds,
      0,
    ) / 60,
  ),
);
const publicRecommendedCompleted = computed(() =>
  publicTodayCompletedSessions.value.some(
    (item) => item.exerciseId === publicRecommendedGame.value.id,
  ),
);
const featuredGame = computed(() =>
  mode.value === "cardiac"
    ? firstPrescriptionGame.value || exerciseGames[0]
    : publicRecommendedGame.value,
);
const selectedGame = computed(
  () =>
    exerciseGames.find((item) => item.id === selectedGameId.value) ||
    exerciseGames[0],
);
const todayActivity = computed(
  () =>
    activities.find((item) => item.id === selectedGame.value.activityId) ||
    activities[0],
);
const selectedCategory = computed(
  () =>
    exerciseCategories.find((item) => item.id === selectedCategoryId.value) ||
    exerciseCategories[0],
);
const categoryGames = computed(() =>
  exerciseGames.filter((item) => item.categoryId === selectedCategoryId.value),
);
const expandedCategoryGames = computed(() =>
  expandedCategoryId.value
    ? exerciseGames.filter(
        (item) => item.categoryId === expandedCategoryId.value,
      )
    : [],
);
const visibleSelfDirectedGames = computed(() =>
  mode.value === "public"
    ? categoryGames.value
    : expandedCategoryGames.value,
);
const selfSelectedGame = computed(() =>
  selfSelectedGameId.value
    ? exerciseGames.find((item) => item.id === selfSelectedGameId.value)
    : undefined,
);
const activePrescriptionTask = computed(() =>
  prescriptionTasks.value.find(
    (item) => item.key === activePrescriptionItemKey.value,
  ),
);
const categoryRecommendedGame = computed(
  () =>
    exerciseGames.find(
      (item) => item.id === selectedCategory.value.recommendedGameId,
    ) || categoryGames.value[0],
);
const selectedKnowledgeItem = computed(
  () =>
    knowledgeItems.find((item) => item.id === selectedKnowledgeId.value) ||
    knowledgeItems[0],
);
const selectedSession = computed(
  () =>
    sessions.value.find((item) => item.id === selectedSessionId.value) ||
    sessions.value[0],
);
const latestAdvice = computed(
  () => sessions.value.find((item) => item.advice)?.advice,
);
const currentMetrics = computed(() =>
  mode.value === "cardiac" ? patientMetrics : publicMetrics,
);
const visibleMetrics = computed(() => currentMetrics.value.slice(0, 2));
const todayStepRecord = computed(() =>
  dailyStepRecords.value.find((item) => item.date === todayKey()),
);
const validTodayStepRecord = computed(() =>
  todayStepRecord.value?.quality === "valid" ? todayStepRecord.value : undefined,
);
const hasValidDeviceSteps = computed(
  () =>
    Boolean(validTodayStepRecord.value) &&
    validTodayStepRecord.value?.source !== "manual",
);
const todayStepProgress = computed(() => {
  if (!validTodayStepRecord.value) return 0;
  return Math.min(
    100,
    Math.round(
      (validTodayStepRecord.value.steps / validTodayStepRecord.value.goal) * 100,
    ),
  );
});
const sevenDayStepTrend = computed(() => {
  const byDate = new Map(
    dailyStepRecords.value.map((item) => [item.date, item]),
  );
  return Array.from({ length: 7 }, (_, index) => {
    const date = addLocalDays(new Date(), index - 6);
    const key = localDateKey(date);
    const record = byDate.get(key);
    return {
      key,
      label: key === todayKey() ? "今日" : `${date.getMonth() + 1}/${date.getDate()}`,
      steps: record?.quality === "valid" ? record.steps : undefined,
      today: key === todayKey(),
    };
  });
});
const validStepTrendDays = computed(
  () => sevenDayStepTrend.value.filter((item) => item.steps !== undefined).length,
);
const stepTrendMaximum = computed(() =>
  Math.max(
    DAILY_STEP_GOAL,
    ...sevenDayStepTrend.value.map((item) => item.steps ?? 0),
  ),
);
const displayName = computed(() =>
  mode.value === "cardiac"
    ? sharedPatientFixture.patient.maskedName
    : publicHealthProfile.value.name,
);
const topbarTitle = computed(() =>
  activeNav.value === "data"
    ? "训练数据"
    : {
        today: `${greeting()}，${displayName.value}`,
        discover: "康复资讯",
        assistant: "小喜",
        profile: "个人信息",
      }[activeNav.value],
);
const todayLabel = computed(
  () =>
    `${new Date().getMonth() + 1}月${new Date().getDate()}日 · ${mode.value === "cardiac" ? "按计划安全运动" : "完成今天的一小步"}`,
);
const healthGoalLabel = computed(() =>
  healthGoal.value === "cardiac"
    ? "完成心脏康复阶段计划"
    : healthGoal.value === "weight"
      ? "用稳定运动支持健康减重"
      : "建立可持续的运动习惯",
);
const activeTrainingTitle = computed(
  () => activePrescriptionTask.value?.item.project || selectedGame.value.title,
);
const trainingTargetSeconds = computed(() => {
  const prescribed =
    activePrescriptionTask.value?.item.duration.match(/\d+/)?.[0];
  return prescribed
    ? Number(prescribed) * 60
    : selectedGame.value.durationSeconds ||
        selectedGame.value.durationMinutes * 60;
});
const formattedElapsed = computed(() => formatTimer(elapsed.value));
const activityScore = computed(() =>
  selectedGame.value.interaction === "camera-score"
    ? Math.min(96, 82 + Math.floor(elapsed.value / 15))
    : selectedGame.value.interaction === "rep-game"
      ? Math.round((repCount.value / 12) * 100)
      : Math.round((rhythmHits.value / Math.max(1, rhythmTotal.value)) * 100),
);
const supportsLiveVitals = computed(() =>
  ["baduanjin", "walking", "power-bike", "resistance", "balance"].includes(
    selectedGameId.value,
  ),
);
const showLiveVitals = computed(
  () =>
    deviceConnected.value &&
    supportsLiveVitals.value &&
    (trainingStatus.value === "active" || trainingStatus.value === "paused"),
);
const rhythmRound = computed(() =>
  Math.min(3, Math.max(1, Math.ceil(rhythmTotal.value / 8))),
);
const isCurrentPrescription = computed(
  () => mode.value === "cardiac" && Boolean(activePrescriptionItemKey.value),
);
const completedExerciseCount = computed(
  () =>
    new Set(completedTodaySessions.value.map((item) => item.exerciseId)).size,
);
const completedMinutes = computed(() =>
  Math.round(
    completedTodaySessions.value.reduce(
      (sum, item) => sum + item.durationSeconds,
      0,
    ) / 60,
  ),
);
const totalCompletedSessions = computed(
  () => sessions.value.filter((item) => item.status === "completed").length,
);
const totalMinutes = computed(() =>
  Math.round(
    sessions.value
      .filter((item) => item.status === "completed")
      .reduce((sum, item) => sum + item.durationSeconds, 0) / 60,
  ),
);
const recentSessions = computed(() =>
  sessions.value.filter((item) => item.status === "completed").slice(0, 7),
);
const taskCompleted = computed(() =>
  mode.value === "public"
    ? publicTodayCompleted.value
    : completedTodaySessions.value.some(
        (item) => item.exerciseId === featuredGame.value.id,
      ),
);
const prescriptionCompletedCount = computed(
  () => prescriptionTasks.value.filter((item) => item.completed).length,
);
const prescriptionAllDone = computed(
  () =>
    mode.value === "cardiac" &&
    prescriptionTasks.value.length > 0 &&
    prescriptionCompletedCount.value === prescriptionTasks.value.length,
);
const checkInDone = computed(() =>
  checkIns.value.some((item) => item.date === todayKey()),
);
const streak = computed(() => calculateStreak(checkIns.value));
const totalCheckInDays = computed(
  () => new Set(checkIns.value.map((item) => item.date)).size,
);
const gardenStageLabels = [
  "新种子",
  "已经播种",
  "冒芽了",
  "长成幼苗",
  "正在舒展",
  "茁壮成长",
  "快成熟了",
];
const gardenCycleDay = computed(
  () => totalCheckInDays.value % GARDEN_CYCLE_LENGTH,
);
const gardenViewState = computed(() => ({
  progress: Math.round(
    (gardenCycleDay.value / GARDEN_CYCLE_LENGTH) * 100,
  ),
  cycleDay: gardenCycleDay.value,
  cycleLength: GARDEN_CYCLE_LENGTH,
  stageIndex: gardenCycleDay.value,
  stageLabel: gardenStageLabels[gardenCycleDay.value],
  harvestCount: Math.floor(
    totalCheckInDays.value / GARDEN_CYCLE_LENGTH,
  ),
  remainingDays:
    gardenCycleDay.value === 0
      ? GARDEN_CYCLE_LENGTH
      : GARDEN_CYCLE_LENGTH - gardenCycleDay.value,
  checkedToday: checkInDone.value,
}));
const exercisePageStatus = computed(() =>
  mode.value === "cardiac"
    ? `${prescriptionCompletedCount.value}/${prescriptionTasks.value.length}`
    : publicTodayCompleted.value
      ? "已运动"
      : "推荐",
);
const gardenStripTitle = computed(() =>
  checkInDone.value
    ? "小白菜今天已长大"
    : `小白菜成长第${gardenViewState.value.cycleDay}/7天`,
);
const gardenStripCopy = computed(() =>
  checkInDone.value
    ? "明天继续就好，不需要额外加量"
    : "完成今天第一项有效运动后会继续成长",
);
const weeklyCompletedDays = computed(
  () => weeklyPlanDays.value.filter((item) => item.done).length,
);
const weeklyPlanDays = computed(() => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const monday = addLocalDays(new Date(), -todayIndex);
  return ["一", "二", "三", "四", "五", "六", "日"].map((label, index) => {
    const date = addLocalDays(monday, index);
    const game = exerciseGames[[0, 2, 3, 4, 7, 5, 6][index]];
    return {
      label,
      index: index + 1,
      gameId: game.id,
      game,
      today: index === todayIndex,
      done: checkIns.value.some((item) => item.date === localDateKey(date)),
    };
  });
});
const currentMonthKey = computed(() => monthKey(new Date()));
const calendarTitle = computed(() => {
  const [year, month] = calendarMonth.value.split("-").map(Number);
  return `${year}年${month}月`;
});
const calendarCells = computed(() =>
  buildCalendarCells(calendarMonth.value, checkIns.value),
);
const canGoNextMonth = computed(
  () => calendarMonth.value < currentMonthKey.value,
);
const teamJoined = computed(() => teamState.value.joined);
const teamMembers = computed(() => [
  {
    id: "self",
    name: "我",
    status: checkInDone.value ? "今日已打卡" : "今日待打卡",
    streak: streak.value,
    self: true,
  },
  { id: "kang", name: "康姐", status: "今日已打卡", streak: 12, self: false },
  { id: "dong", name: "小动", status: "今日待打卡", streak: 4, self: false },
  { id: "lin", name: "林叔", status: "今日已打卡", streak: 9, self: false },
]);
const teamCheckedCount = computed(
  () => teamMembers.value.filter((item) => item.status === "今日已打卡").length,
);
const teamProgress = computed(() =>
  Math.round((teamCheckedCount.value / teamMembers.value.length) * 100),
);
const buddyDay = computed(() =>
  buddyState.value.startedAt
    ? Math.min(
        buddyState.value.cycleDays,
        Math.max(
          1,
          Math.floor(
            (startOfLocalDay(new Date()).getTime() -
              parseDateKey(buddyState.value.startedAt).getTime()) /
              86400000,
          ) + 1,
        ),
      )
    : 1,
);
const preReady = computed(() => snapshotReady(preSnapshot.value, "pre"));
const postReady = computed(() => snapshotReady(postSnapshot.value, "post"));
const pendingReviewCount = computed(
  () => doctorReviews.value.filter((item) => item.status === "pending").length,
);
const memChallengeDays = computed(() => {
  const streakDays = calculateMemChallengeDays();
  return streakDays === 0 ? 0 : ((streakDays - 1) % 7) + 1;
});
const visibleRewards = computed(() =>
  rewardItems.filter(
    (item) =>
      item.audience === "all" ||
      (item.audience === "cardiac" && mode.value === "cardiac") ||
      (item.audience === "mem" && mem.value.unlocked),
  ),
);
const detailTitle = computed(
  () =>
    ({
      precheck: "训练前状态",
      training: activeTrainingTitle.value,
      postcheck: "训练后状态",
      "session-report": "运动解读",
      "training-reports": "训练报告",
      "health-archive": "健康档案",
      devices: "设备与授权",
      "knowledge-article": "指南",
      "knowledge-video": "短视频",
      "reward-store": "健康权益",
      "weekly-path": "本周路径",
      "exercise-category": selectedCategory.value.title,
      "prototype-policy": "训练状态策略",
      "doctor-reviews": "医生审核",
      "hospital-report": "医院记录",
      "social-hub": socialTab.value === "buddy" ? "健康搭子" : "健康小队",
      none: "",
    })[detailView.value],
);

function pad(value: number) {
  return String(value).padStart(2, "0");
}
function localDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function todayKey() {
  return localDateKey(new Date());
}
function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addLocalDays(date: Date, amount: number) {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}
function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, Math.max(0, month - 1), day || 1);
}
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "上午好" : hour < 18 ? "下午好" : "晚上好";
}
function formatTimer(value: number) {
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}
function formatDuration(value: number) {
  return value >= 60
    ? `${Math.floor(value / 60)}分${value % 60 ? (value % 60) + "秒" : ""}`
    : `${value}秒`;
}
function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function compactSessionDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatTime(value: string) {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatSteps(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function formatCompactSteps(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}
function formatStepSyncedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return localDateKey(date) === todayKey()
    ? formatTime(value)
    : `${date.getMonth() + 1}/${date.getDate()} ${formatTime(value)}`;
}
function stepBarHeight(value?: number) {
  if (value === undefined) return 0;
  if (value === 0) return 3;
  return Math.max(5, Math.round((value / stepTrendMaximum.value) * 100));
}
function sourceLabel(source: DataSource) {
  return {
    "hospital-device": "医院/直接设备",
    "apple-health": "Apple健康",
    "health-connect": "Health Connect",
    manual: "手动录入",
    "demo-device": "模拟设备适配器",
  }[source];
}
function qualityLabel(quality: DataQuality) {
  return {
    valid: "数据有效",
    stale: "数据已过期",
    missing: "暂无数据",
    denied: "未授权",
  }[quality];
}
function modeLabel(value: AssessmentMode) {
  return { off: "关闭", optional: "可选", required: "必填" }[value];
}
function adviceLevelLabel(level: AdviceLevel) {
  return {
    stable: "稳定",
    attention: "需关注",
    stop: "立即停止",
    insufficient: "数据不足",
  }[level];
}
function reviewStatusLabel(status: ReviewStatus) {
  return {
    pending: "待审核",
    approved: "已同意",
    rejected: "已驳回",
    maintained: "维持计划",
  }[status];
}
function snapshotSummary(snapshot?: VitalSnapshot) {
  if (!snapshot || snapshot.quality !== "valid") return "数据不足";
  if (snapshot.phase === "pre")
    return `不适 ${snapshot.discomfortScore ?? "--"}/10 · 血压 ${snapshot.systolicBloodPressure ?? "--"}/${snapshot.diastolicBloodPressure ?? "--"} mmHg · 血氧 ${snapshot.oxygenSaturation ?? "--"}%`;
  return `心率 ${snapshot.heartRate ?? "--"} · 血氧 ${snapshot.oxygenSaturation ?? "--"}% · Borg ${snapshot.borg ?? "--"}`;
}

function createDefaultPolicy(): TrainingAssessmentPolicy {
  const now = new Date().toISOString();
  return {
    id: "POLICY-CARDIAC-DEMO",
    version: 1,
    status: "published",
    audience: "cardiac",
    preMode: "required",
    postMode: "required",
    fields: {
      heartRate: true,
      oxygenSaturation: true,
      symptoms: true,
      borg: true,
      feeling: true,
      bloodPressure: true,
    },
    preValidMinutes: 10,
    postWindowMinutes: 5,
    sourcePriority: [
      "hospital-device",
      "apple-health",
      "health-connect",
      "manual",
      "demo-device",
    ],
    updatedAt: now,
    publishedAt: now,
  };
}
function createVitalSnapshot(
  phase: "pre" | "post",
  quality: DataQuality = phase === "pre" ? "missing" : "valid",
): VitalSnapshot {
  const now = new Date().toISOString();
  const hasReading = quality === "valid";
  return {
    phase,
    heartRate: hasReading ? (phase === "pre" ? 68 : 76) : undefined,
    oxygenSaturation: hasReading ? 98 : undefined,
    systolicBloodPressure:
      phase === "pre" && hasReading ? 128 : undefined,
    diastolicBloodPressure:
      phase === "pre" && hasReading ? 78 : undefined,
    discomfortScore: phase === "pre" && hasReading ? 0 : undefined,
    borg: phase === "post" && hasReading ? 3 : undefined,
    feeling: phase === "post" && hasReading ? "适中" : undefined,
    symptoms: [],
    source: hasReading ? "demo-device" : "manual",
    measuredAt: now,
    syncedAt: now,
    quality,
  };
}
function buildSeedCheckIns(count = 6): CheckInRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const date = addLocalDays(new Date(), index - count);
    return {
      date: localDateKey(date),
      source: "legacy-demo",
      exerciseId: "baduanjin",
      pointsAwarded: 5,
      createdAt: `${localDateKey(date)}T08:00:00`,
    };
  });
}
function buildSeedDailySteps(): DailyStepRecord[] {
  const demoSteps = [4380, 5120, 4760, 5840, 6210, 4980, 5420];
  return demoSteps.map((steps, index) => {
    const date = addLocalDays(new Date(), index - (demoSteps.length - 1));
    const dateKey = localDateKey(date);
    return {
      date: dateKey,
      steps,
      goal: DAILY_STEP_GOAL,
      source: "demo-device",
      quality: "valid",
      syncedAt:
        dateKey === todayKey()
          ? new Date().toISOString()
          : `${dateKey}T20:00:00`,
    };
  });
}
function migrateDailyStepRecords(saved: Record<string, any>) {
  const schemaVersion = Number(saved.schemaVersion);
  if (!Number.isFinite(schemaVersion) || schemaVersion < 7)
    return buildSeedDailySteps();
  if (!Array.isArray(saved.dailyStepRecords)) return [];
  const sources: DataSource[] = [
    "hospital-device",
    "apple-health",
    "health-connect",
    "manual",
    "demo-device",
  ];
  const qualities: DataQuality[] = ["valid", "stale", "missing", "denied"];
  const unique = new Map<string, DailyStepRecord>();
  saved.dailyStepRecords.forEach((item: Partial<DailyStepRecord>) => {
    const steps = Number(item.steps);
    if (
      !item.date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      !Number.isInteger(steps) ||
      steps < 0 ||
      steps > 100000
    )
      return;
    unique.set(item.date, {
      date: item.date,
      steps,
      goal:
        Number.isInteger(Number(item.goal)) && Number(item.goal) > 0
          ? Number(item.goal)
          : DAILY_STEP_GOAL,
      source: sources.includes(item.source as DataSource)
        ? (item.source as DataSource)
        : "manual",
      quality: qualities.includes(item.quality as DataQuality)
        ? (item.quality as DataQuality)
        : "missing",
      syncedAt:
        typeof item.syncedAt === "string" && item.syncedAt
          ? item.syncedAt
          : `${item.date}T00:00:00`,
    });
  });
  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
}
function upsertDailyStepRecord(record: DailyStepRecord) {
  dailyStepRecords.value = [
    ...dailyStepRecords.value.filter((item) => item.date !== record.date),
    record,
  ].sort((a, b) => a.date.localeCompare(b.date));
}
function createDefaultTeamState(): TeamState {
  return {
    joined: false,
    teamId: "TEAM-XQ-7DAY",
    name: "小喜鹊7天轻运动队",
    inviteCode: "XQ-7DAY",
    reminderDates: {},
    applicationStatus: "idle",
  };
}
function createDefaultBuddyState(): BuddyState {
  return {
    connected: false,
    buddyId: "BUDDY-KANG",
    buddyName: "康康",
    cycleDays: 7,
    startedAt: "",
    reminderSentDate: "",
    applicationStatus: "idle",
  };
}
function calculateStreak(records: CheckInRecord[]) {
  const dates = new Set(records.map((item) => item.date));
  let cursor = startOfLocalDay(new Date());
  if (!dates.has(localDateKey(cursor))) cursor = addLocalDays(cursor, -1);
  let count = 0;
  while (dates.has(localDateKey(cursor))) {
    count += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return count;
}
function buildCalendarCells(value: string, records: CheckInRecord[]) {
  const [year, month] = value.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const checked = new Set(records.map((item) => item.date));
  const blanks = Array.from({ length: leading }, (_, index) => ({
    key: `blank-${index}`,
    day: 0,
    blank: true,
    checked: false,
    today: false,
    future: false,
  }));
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    const key = localDateKey(date);
    return {
      key,
      day: index + 1,
      blank: false,
      checked: checked.has(key),
      today: key === todayKey(),
      future: date.getTime() > startOfLocalDay(new Date()).getTime(),
    };
  });
  return [...blanks, ...days];
}
function migrateCheckIns(saved: Record<string, any>): CheckInRecord[] {
  if (Array.isArray(saved.checkIns) && saved.checkIns.length) {
    const unique = new Map<string, CheckInRecord>();
    saved.checkIns.forEach((item: Partial<CheckInRecord>) => {
      if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return;
      unique.set(item.date, {
        date: item.date,
        source:
          item.source === "core-exercise" ? "core-exercise" : "legacy-demo",
        exerciseId: item.exerciseId,
        pointsAwarded: Number(item.pointsAwarded) || 0,
        createdAt: item.createdAt || `${item.date}T08:00:00`,
      });
    });
    return [...unique.values()];
  }
  return buildSeedCheckIns();
}

function chooseMode(value: UserMode) {
  mode.value = value;
  if (value === "cardiac") {
    healthGoal.value = "cardiac";
    onboardingStep.value = "binding";
  } else {
    healthGoal.value = "habit";
    enterApp();
  }
}
function backToMode() {
  onboardingStep.value = "mode";
  bindingState.value = "idle";
  visitNumber.value = "";
}
function bindPatient() {
  if (bindingState.value === "matched") {
    enterApp();
    return;
  }
  bindingState.value = "loading";
  setTimeout(() => {
    bindingState.value = isSupportedPatientNo(visitNumber.value)
      ? "matched"
      : "error";
  }, 420);
}
function enterApp() {
  appReady.value = true;
  activeNav.value = "today";
  todayPageIndex.value = TODAY_PAGE_EXERCISE;
  focusFirstIncompletePrescription();
  persistState();
}
function switchMode() {
  appReady.value = false;
  onboardingStep.value = "mode";
  bindingState.value = "idle";
  detailView.value = "none";
  activeNav.value = "today";
  todayPageIndex.value = TODAY_PAGE_EXERCISE;
  prescriptionSlide.value = 0;
  prescriptionGestureActive.value = false;
}
function setHealthGoal(goal: HealthGoal) {
  healthGoal.value = goal;
  persistState();
}
function syncPublicProfileDraft() {
  publicProfileDraft.value = {
    name: publicHealthProfile.value.name,
    age:
      publicHealthProfile.value.age === null
        ? ""
        : String(publicHealthProfile.value.age),
  };
  publicProfileErrors.value = { name: "", age: "" };
}
function savePublicProfile() {
  const name = publicProfileDraft.value.name.trim();
  const ageText = String(publicProfileDraft.value.age).trim();
  const age = Number(ageText);
  const nameError =
    name.length < 1 || name.length > 20 ? "请输入1–20个字符的姓名" : "";
  const ageError =
    !/^\d+$/.test(ageText) || !Number.isInteger(age) || age < 18 || age > 100
      ? "请输入18–100之间的整数年龄"
      : "";
  publicProfileErrors.value = { name: nameError, age: ageError };
  if (nameError || ageError) return;
  publicHealthProfile.value = { name, age };
  publicProfileDraft.value = { name, age: String(age) };
  persistState();
  uni.showToast({ title: "个人信息已保存", icon: "success" });
}
function goDetail(view: DetailView) {
  if (view !== "training") stopTimer();
  if (view === "health-archive" && mode.value === "public")
    syncPublicProfileDraft();
  detailReturnNav.value = activeNav.value;
  detailView.value = view;
}
function closeDetail() {
  const closingSessionReport = detailView.value === "session-report";
  const closesNewGrowth = Boolean(
    closingSessionReport &&
      pendingGardenFeedback.value &&
      selectedSession.value?.id === pendingGardenFeedback.value.sessionId,
  );
  stopTimer();
  detailView.value = "none";
  if (closesNewGrowth) {
    activeNav.value = "today";
    todayPageIndex.value = TODAY_PAGE_GARDEN;
  } else {
    activeNav.value = detailReturnNav.value;
    if (closingSessionReport && detailReturnNav.value === "today")
      todayPageIndex.value = TODAY_PAGE_EXERCISE;
  }
  if (closingSessionReport) pendingGardenFeedback.value = null;
}
function switchNav(nav: NavId) {
  activeNav.value = nav;
}
function openGardenCheckIn() {
  activeNav.value = "today";
  todayPageIndex.value = TODAY_PAGE_GARDEN;
  gardenScrollTop.value = 0;
  nextTick(() => {
    gardenScrollTop.value = 999999;
  });
}
function showTodayPage(index: TodayPageIndex) {
  prescriptionGestureActive.value = false;
  todayPageIndex.value = index;
}
function onTodayPageChange(event: any) {
  prescriptionGestureActive.value = false;
  todayPageIndex.value =
    Number(event.detail.current) === TODAY_PAGE_EXERCISE
      ? TODAY_PAGE_EXERCISE
      : TODAY_PAGE_GARDEN;
}
function onPrescriptionSlide(event: any) {
  const next = Number(event.detail.current);
  const maxIndex = Math.max(0, prescriptionTasks.value.length - 1);
  prescriptionSlide.value = Number.isFinite(next)
    ? Math.min(Math.max(next, 0), maxIndex)
    : 0;
}
function setPrescriptionGesture(active: boolean) {
  prescriptionGestureActive.value = active;
}
function focusFirstIncompletePrescription() {
  const firstIncomplete = prescriptionTasks.value.findIndex(
    (task) => !task.completed,
  );
  prescriptionSlide.value = firstIncomplete >= 0 ? firstIncomplete : 0;
}
function toggleCategory(id: ExerciseCategoryId) {
  selectedCategoryId.value = id;
  expandedCategoryId.value = expandedCategoryId.value === id ? "" : id;
  persistState();
}
function chooseSelfDirected(id: ExerciseGameId) {
  selfSelectedGameId.value = id;
  activePrescriptionItemKey.value = "";
  persistState();
  uni.showToast({ title: "已加入自选运动", icon: "none" });
}
function startPublicRecommended() {
  activePrescriptionItemKey.value = "";
  selectExercise(publicRecommendedGame.value.id);
}
function startSelfSelected() {
  if (!selfSelectedGame.value) return;
  activePrescriptionItemKey.value = "";
  selectExercise(selfSelectedGame.value.id);
}
function startPrescriptionTask(task: {
  item: SharedPrescriptionItem;
  key: string;
  game?: (typeof exerciseGames)[number];
}) {
  if (!task.game) return;
  const taskIndex = prescriptionTasks.value.findIndex(
    (item) => item.key === task.key,
  );
  if (taskIndex >= 0) prescriptionSlide.value = taskIndex;
  activePrescriptionItemKey.value = task.key;
  selectExercise(task.game.id);
}
function openSocial(tab: "team" | "buddy") {
  socialTab.value = tab;
  detailReturnNav.value = "discover";
  detailView.value = "social-hub";
}
function openKnowledgeItem(item: (typeof knowledgeItems)[number]) {
  selectedKnowledgeId.value = item.id;
  detailReturnNav.value = "discover";
  detailView.value =
    item.type === "video" ? "knowledge-video" : "knowledge-article";
}
function openSession(session: TrainingSession) {
  selectedSessionId.value = session.id;
  detailReturnNav.value = "data";
  detailView.value = "session-report";
}
function openLatestReport() {
  if (!sessions.value.length) {
    openTrainingReports();
    return;
  }
  selectedSessionId.value = sessions.value[0].id;
  goDetail("session-report");
}
function openTrainingReports() {
  goDetail("training-reports");
}
function shiftCalendarMonth(amount: number) {
  const [year, month] = calendarMonth.value.split("-").map(Number);
  const next = new Date(year, month - 1 + amount, 1);
  const key = monthKey(next);
  if (key <= currentMonthKey.value) calendarMonth.value = key;
}

function resetTraining() {
  stopTimer();
  trainingStatus.value = "idle";
  elapsed.value = 0;
  repCount.value = 0;
  repStreak.value = 0;
  rhythmHits.value = 0;
  rhythmTotal.value = 0;
  rhythmCombo.value = 0;
  demoCompleted.value = false;
  cameraStatus.value = "idle";
  stoppedReason.value = "";
  pendingCheckInAward.value = 0;
  pendingGardenFeedback.value = null;
  liveHeartRate.value = 76;
  liveOxygen.value = 98;
  liveVitalUpdatedAt.value = "";
  preSnapshot.value = createVitalSnapshot("pre");
  postSnapshot.value = createVitalSnapshot("post");
  preVitalInputMode.value = "none";
}
function selectExercise(id: ExerciseGameId) {
  detailReturnNav.value = activeNav.value;
  selectedGameId.value = id;
  resetTraining();
  if (mode.value === "cardiac" && publishedPolicy.value.preMode !== "off") {
    trainingStatus.value = "checking";
    detailView.value = "precheck";
  } else startTraining();
}
function startTraining() {
  if (preSnapshot.value.symptoms.length) return;
  if (
    mode.value === "cardiac" &&
    publishedPolicy.value.preMode === "required" &&
    !preReady.value
  )
    return;
  detailView.value = "training";
  trainingStatus.value = "active";
  elapsed.value = 0;
  if (deviceConnected.value) initializeLiveVitals();
  startTimer();
}
function skipPre() {
  preSnapshot.value.quality = "missing";
  startTraining();
}
function skipPost() {
  postSnapshot.value.quality = "missing";
  generateReport();
}
function startTimer() {
  stopTimer();
  trainingTimer = setInterval(() => {
    if (trainingStatus.value === "active") {
      if (selectedGameId.value === "baduanjin") return;
      elapsed.value += 1;
      if (deviceConnected.value && elapsed.value % 3 === 0)
        updateLiveVitals();
      if (elapsed.value >= trainingTargetSeconds.value) finishTraining(false);
    }
  }, 1000);
}
function syncCourseElapsed(value: number) {
  if (
    selectedGameId.value !== "baduanjin" ||
    trainingStatus.value !== "active" ||
    !Number.isFinite(value)
  )
    return;
  const next = Math.min(
    trainingTargetSeconds.value,
    Math.max(0, Math.floor(value)),
  );
  const previous = elapsed.value;
  elapsed.value = next;
  if (deviceConnected.value && next !== previous && next % 3 === 0)
    updateLiveVitals();
}
function initializeLiveVitals() {
  liveHeartRate.value = Number.isFinite(preSnapshot.value.heartRate)
    ? Number(preSnapshot.value.heartRate)
    : 76;
  liveOxygen.value = Number.isFinite(preSnapshot.value.oxygenSaturation)
    ? Number(preSnapshot.value.oxygenSaturation)
    : 98;
  liveVitalUpdatedAt.value = new Date().toISOString();
}
function updateLiveVitals() {
  const intensityLift =
    selectedGame.value.categoryId === "aerobic"
      ? 18
      : selectedGame.value.categoryId === "strength"
        ? 13
        : 8;
  const progressLift = Math.min(10, Math.floor(elapsed.value / 30));
  const wave = Math.round(Math.sin(elapsed.value / 7) * 2);
  liveHeartRate.value = Math.max(
    60,
    Math.min(126, 72 + intensityLift + progressLift + wave),
  );
  liveOxygen.value = elapsed.value % 21 < 3 ? 97 : 98;
  liveVitalUpdatedAt.value = new Date().toISOString();
}
function stopTimer() {
  if (trainingTimer) clearInterval(trainingTimer);
  trainingTimer = undefined;
}
function toggleTraining() {
  trainingStatus.value =
    trainingStatus.value === "paused" ? "active" : "paused";
}
function recordRep() {
  if (trainingStatus.value !== "active" || repCount.value >= 12) return;
  repCount.value += 1;
  repStreak.value += 1;
}
function recordBeat() {
  if (trainingStatus.value !== "active" || rhythmHits.value >= 24) return;
  rhythmTotal.value += 1;
  if (rhythmTotal.value % 7 === 0) rhythmCombo.value = 0;
  else {
    rhythmHits.value += 1;
    rhythmCombo.value += 1;
  }
}
function finishTraining(isDemo: boolean) {
  if (isDemo) {
    elapsed.value = trainingTargetSeconds.value;
    if (selectedGame.value.interaction === "rep-game") {
      repCount.value = 12;
      repStreak.value = 12;
    }
    if (selectedGame.value.interaction === "rhythm-game") {
      rhythmHits.value = 24;
      rhythmTotal.value = 26;
      rhythmCombo.value = 8;
    }
    demoCompleted.value = true;
  }
  stopTimer();
  trainingStatus.value = "completed";
  pendingCheckInAward.value = autoCheckInCoreExercise();
  if (mode.value === "cardiac" && publishedPolicy.value.postMode !== "off")
    detailView.value = "postcheck";
  else generateReport();
}
function stopTraining(reason: string) {
  stopTimer();
  showStopReason.value = false;
  trainingStatus.value = "stopped";
  stoppedReason.value = reason;
  postSnapshot.value.symptoms = [reason];
  if (mode.value === "cardiac" && publishedPolicy.value.postMode !== "off")
    detailView.value = "postcheck";
  else generateReport();
}
function stopBeforeStart() {
  trainingStatus.value = "stopped";
  stoppedReason.value = preSnapshot.value.symptoms[0] || "训练前报告不适";
  elapsed.value = 0;
  generateReport();
}
function setPreDiscomfortScore(event: any) {
  preSnapshot.value.discomfortScore = Number(event.detail.value);
}
function reportPrecheckDiscomfort() {
  preSnapshot.value.symptoms = ["胸痛、明显气促、头晕或心悸等明显不适"];
  stopBeforeStart();
}
function readPreVitalsFromDevice() {
  const now = new Date().toISOString();
  const source =
    deviceConnected.value && preSnapshot.value.source !== "manual"
      ? preSnapshot.value.source
      : "demo-device";
  preVitalInputMode.value = "device";
  preSnapshot.value = {
    ...preSnapshot.value,
    heartRate: 68,
    oxygenSaturation: 98,
    systolicBloodPressure: 128,
    diastolicBloodPressure: 78,
    source,
    measuredAt: now,
    syncedAt: now,
    quality: "valid",
  };
  deviceConnected.value = true;
  persistState();
  uni.showToast({ title: "已读取设备数据", icon: "none" });
}
function chooseManualPreVitals() {
  const now = new Date().toISOString();
  preVitalInputMode.value = "manual";
  preSnapshot.value = {
    ...preSnapshot.value,
    heartRate: undefined,
    oxygenSaturation: undefined,
    systolicBloodPressure: undefined,
    diastolicBloodPressure: undefined,
    source: "manual",
    measuredAt: now,
    syncedAt: now,
    quality: "missing",
  };
}
function setManualPreVital(field: PreVitalField, event: any) {
  if (preVitalInputMode.value !== "manual") return;
  const rawValue = String(event.detail.value ?? "").trim();
  preSnapshot.value[field] = rawValue === "" ? undefined : Number(rawValue);
  const now = new Date().toISOString();
  preSnapshot.value.measuredAt = now;
  preSnapshot.value.syncedAt = now;
  const values = [
    preSnapshot.value.systolicBloodPressure,
    preSnapshot.value.diastolicBloodPressure,
    preSnapshot.value.oxygenSaturation,
  ];
  preSnapshot.value.quality = values.every(
    (value) => Number.isFinite(value) && Number(value) > 0,
  )
    ? "valid"
    : "missing";
}
function updatePreSymptoms(event: { detail: { value: string[] } }) {
  preSnapshot.value.symptoms = event.detail.value;
}
function setSnapshotBorg(phase: "pre" | "post", event: any) {
  const target = phase === "pre" ? preSnapshot : postSnapshot;
  target.value.borg = Number(event.detail.value);
}
function setPostFeeling(feeling: string) {
  postSnapshot.value.feeling = feeling as VitalSnapshot["feeling"];
}
function simulateVitalSync(phase: "pre" | "post") {
  if (phase === "pre") {
    readPreVitalsFromDevice();
    return;
  }
  postSnapshot.value = createVitalSnapshot("post");
  deviceConnected.value = true;
  persistState();
  uni.showToast({ title: "已同步模拟设备数据", icon: "none" });
}
function useManualSnapshot(phase: "pre" | "post") {
  if (phase === "pre") {
    chooseManualPreVitals();
    return;
  }
  postSnapshot.value.source = "manual";
  postSnapshot.value.measuredAt = new Date().toISOString();
  postSnapshot.value.syncedAt = postSnapshot.value.measuredAt;
  postSnapshot.value.quality = "valid";
  persistState();
  uni.showToast({ title: "已标记为外部设备读数", icon: "none" });
}
function snapshotReady(snapshot: VitalSnapshot, phase: "pre" | "post") {
  if (phase === "pre")
    return (
      snapshot.quality === "valid" &&
      Number.isFinite(snapshot.discomfortScore) &&
      Number(snapshot.discomfortScore) >= 0 &&
      Number(snapshot.discomfortScore) <= 10 &&
      Number.isFinite(snapshot.systolicBloodPressure) &&
      Number(snapshot.systolicBloodPressure) > 0 &&
      Number.isFinite(snapshot.diastolicBloodPressure) &&
      Number(snapshot.diastolicBloodPressure) > 0 &&
      Number.isFinite(snapshot.oxygenSaturation) &&
      Number(snapshot.oxygenSaturation) > 0
    );
  if (
    snapshot.quality !== "valid" &&
    (publishedPolicy.value.fields.heartRate ||
      publishedPolicy.value.fields.oxygenSaturation)
  )
    return false;
  if (
    publishedPolicy.value.fields.heartRate &&
    !Number.isFinite(snapshot.heartRate)
  )
    return false;
  if (
    publishedPolicy.value.fields.oxygenSaturation &&
    !Number.isFinite(snapshot.oxygenSaturation)
  )
    return false;
  if (publishedPolicy.value.fields.borg && !Number.isFinite(snapshot.borg))
    return false;
  if (
    phase === "post" &&
    publishedPolicy.value.fields.feeling &&
    !snapshot.feeling
  )
    return false;
  return true;
}
function autoCheckInCoreExercise() {
  if (checkInDone.value || trainingStatus.value !== "completed") return 0;
  const beforeDays = totalCheckInDays.value;
  const record: CheckInRecord = {
    date: todayKey(),
    source: "core-exercise",
    exerciseId: selectedGameId.value,
    pointsAwarded: 5,
    createdAt: new Date().toISOString(),
  };
  checkIns.value.push(record);
  const afterDays = beforeDays + 1;
  const harvested = afterDays % GARDEN_CYCLE_LENGTH === 0;
  pendingGardenFeedback.value = {
    sessionId: "",
    beforeDay: beforeDays % GARDEN_CYCLE_LENGTH,
    afterDay: harvested
      ? GARDEN_CYCLE_LENGTH
      : afterDays % GARDEN_CYCLE_LENGTH,
    harvested,
    harvestCount: Math.floor(afterDays / GARDEN_CYCLE_LENGTH),
  };
  wallet.value.healthPoints += 5;
  return 5;
}
function resultItems() {
  if (selectedGame.value.interaction === "camera-score")
    return [
      {
        label: "动作评分",
        value: cameraStatus.value === "ready" ? `${activityScore.value}分` : "未评分",
      },
      {
        label: "整套八式",
        value:
          elapsed.value >= trainingTargetSeconds.value && !demoCompleted.value
            ? "已完整完成"
            : "未完整完成",
      },
    ];
  if (selectedGame.value.interaction === "rep-game")
    return [
      { label: "完成次数", value: `${repCount.value}/12` },
      { label: "连续完成", value: `${repStreak.value}次` },
    ];
  return [
    { label: "节拍命中", value: `${rhythmHits.value}/${rhythmTotal.value}` },
    { label: "完成组数", value: `${rhythmRound.value}/3` },
  ];
}
function buildAssessment(): TrainingAssessment | undefined {
  if (
    mode.value !== "cardiac" ||
    (publishedPolicy.value.preMode === "off" &&
      publishedPolicy.value.postMode === "off")
  )
    return undefined;
  const pre =
    publishedPolicy.value.preMode === "off"
      ? undefined
      : { ...preSnapshot.value, symptoms: [...preSnapshot.value.symptoms] };
  const post =
    publishedPolicy.value.postMode === "off"
      ? undefined
      : { ...postSnapshot.value, symptoms: [...postSnapshot.value.symptoms] };
  const complete =
    (!pre || snapshotReady(pre, "pre")) &&
    (!post || snapshotReady(post, "post"));
  let comparison = "状态数据不完整，不生成确定性变化结论。";
  if (complete && pre && post)
    comparison = `训练前不适程度 ${pre.discomfortScore ?? "--"}/10，血压 ${pre.systolicBloodPressure ?? "--"}/${pre.diastolicBloodPressure ?? "--"} mmHg；训练前后血氧变化 ${Number(post.oxygenSaturation) - Number(pre.oxygenSaturation)} 个百分点。`;
  else if (complete && pre)
    comparison = "仅记录训练前状态，不生成训练前后变化结论。";
  else if (complete && post)
    comparison = "仅记录训练后状态，不生成训练前后变化结论。";
  return {
    id: `ASSESS-${Date.now()}`,
    policyVersion: publishedPolicy.value.version,
    pre,
    post,
    completeness: complete ? "complete" : pre || post ? "partial" : "missing",
    comparison,
  };
}
function buildAdvice(
  sessionId: string,
  assessment?: TrainingAssessment,
): AIAdvice {
  const now = new Date().toISOString();
  const boundary = "本建议用于健康教育与原型演示，不替代医生诊断或处方。";
  if (trainingStatus.value === "stopped" || stoppedReason.value) {
    return {
      id: `ADVICE-${Date.now()}`,
      sessionId,
      level: "stop",
      title: "请立即停止并关注身体信号",
      summary: `已记录“${stoppedReason.value || "身体不适"}”，本次不计完成和积分。`,
      evidence: ["用户主动报告危险症状", "安全停止优先于运动目标"],
      actions: [
        "停止运动并休息",
        "症状明显、持续或加重时及时就医",
        "紧急情况呼叫120",
      ],
      sourceSummary: "依据：用户报告、训练停止记录与医院安全规则。",
      boundary,
      ruleVersion: "RULE-DEMO-1.0",
      createdAt: now,
    };
  }
  if (mode.value === "public") {
    return {
      id: `ADVICE-${Date.now()}`,
      sessionId,
      level: "stable",
      title: "今天的运动已记录",
      summary: "保持当前节奏即可，不需要为了积分额外加量。",
      evidence: [
        `完成${selectedGame.value.duration}`,
        `连续行动${streak.value}天`,
      ],
      actions: ["正常补水和休息", "明天继续本周路径"],
      sourceSummary: "依据：运动时长、完成状态与打卡记录。",
      boundary,
      ruleVersion: "RULE-DEMO-1.0",
      createdAt: now,
    };
  }
  if (
    publishedPolicy.value.preMode === "off" &&
    publishedPolicy.value.postMode === "off"
  ) {
    return {
      id: `ADVICE-${Date.now()}`,
      sessionId,
      level: "stable",
      title: "本次运动已记录",
      summary: "训练状态采集已关闭，本次不判断身体变化。",
      evidence: [
        `完成${selectedGame.value.duration}`,
        `使用策略 v${publishedPolicy.value.version}`,
      ],
      actions: ["完成缓和、补水与休息", "按医院计划进行下一次训练"],
      sourceSummary: "依据：运动完成状态与当前医院策略；未使用身体数值。",
      boundary,
      ruleVersion: "RULE-DEMO-1.0",
      createdAt: now,
    };
  }
  if (!assessment || assessment.completeness !== "complete") {
    return {
      id: `ADVICE-${Date.now()}`,
      sessionId,
      level: "insufficient",
      title: "状态数据不足",
      summary: "本次记录已保存，但无法判断训练前后的身体变化。",
      evidence: ["设备数据缺失、过期或未授权"],
      actions: [
        "重新同步设备",
        "必要时补充外部设备读数",
        "不根据本次数据调整计划",
      ],
      sourceSummary: "依据：数据完整性规则。",
      boundary,
      ruleVersion: "RULE-DEMO-1.0",
      createdAt: now,
    };
  }
  const pre = assessment.pre;
  const post = assessment.post;
  const heartRateChangedSignificantly = Boolean(
    pre &&
      post &&
      Number.isFinite(pre.heartRate) &&
      Number.isFinite(post.heartRate) &&
      Math.abs(Number(post.heartRate) - Number(pre.heartRate)) > 20,
  );
  const attention = Boolean(
    pre &&
    post &&
    ((post.oxygenSaturation ?? 100) < 95 ||
      (pre.oxygenSaturation ?? 100) < 95 ||
      heartRateChangedSignificantly ||
      (post.borg ?? 0) >= 6 ||
      post.feeling === "较累"),
  );
  if (attention)
    return {
      id: `ADVICE-${Date.now()}`,
      sessionId,
      level: "attention",
      title: "恢复状态需要关注",
      summary:
        "训练后数据超出该演示患者的个体范围，建议休息、复测并等待医生确认。",
      evidence: [
        assessment.comparison,
        `运动后Borg ${post?.borg ?? "--"}`,
        `数据来源：${sourceLabel(post?.source || "demo-device")}`,
      ].slice(0, 3),
      actions: [
        "今天不再额外加量",
        "休息后重新测量",
        "将降低强度建议提交医生审核",
      ],
      sourceSummary: "依据：医院患者演示范围、前后变化与数据质量。",
      boundary,
      ruleVersion: "RULE-DEMO-1.0",
      createdAt: now,
    };
  return {
    id: `ADVICE-${Date.now()}`,
    sessionId,
    level: "stable",
    title: "本次状态稳定",
    summary: "训练前后数据处于该演示患者的个体范围，可维持当前计划。",
    evidence: [
      assessment.comparison,
      `运动后Borg ${post?.borg ?? "--"}`,
      `数据来源：${sourceLabel(post?.source || "demo-device")}`,
    ].slice(0, 3),
    actions: ["完成缓和与补水", "维持下一次计划"],
    sourceSummary: "依据：医院患者演示范围、前后变化与数据质量。",
    boundary,
    ruleVersion: "RULE-DEMO-1.0",
    createdAt: now,
  };
}
function generateReport() {
  if (rewardLedger.value.date !== todayKey())
    rewardLedger.value = {
      date: todayKey(),
      exerciseIds: [],
      prescriptionBonusAwarded: false,
    };
  let awarded = 0;
  if (
    trainingStatus.value === "completed" &&
    !rewardLedger.value.exerciseIds.includes(selectedGameId.value)
  ) {
    awarded += 10;
    rewardLedger.value.exerciseIds.push(selectedGameId.value);
  }
  if (
    trainingStatus.value === "completed" &&
    isCurrentPrescription.value &&
    !rewardLedger.value.prescriptionBonusAwarded
  ) {
    awarded += 10;
    rewardLedger.value.prescriptionBonusAwarded = true;
  }
  wallet.value.healthPoints += awarded;
  const id = `SESSION-${Date.now()}`;
  if (pendingGardenFeedback.value)
    pendingGardenFeedback.value = {
      ...pendingGardenFeedback.value,
      sessionId: id,
    };
  const createdAt = new Date().toISOString();
  const assessment = buildAssessment();
  const advice = buildAdvice(id, assessment);
  const poseScored =
    selectedGameId.value === "baduanjin" && cameraStatus.value === "ready";
  const fullRoutineCompleted =
    selectedGameId.value === "baduanjin" &&
    trainingStatus.value === "completed" &&
    !demoCompleted.value &&
    elapsed.value >= trainingTargetSeconds.value;
  const session: TrainingSession = {
    id,
    exerciseId: selectedGameId.value,
    title: activeTrainingTitle.value,
    mode: mode.value,
    planType: isCurrentPrescription.value ? "prescription" : "self-directed",
    status: trainingStatus.value,
    durationSeconds: Math.min(trainingTargetSeconds.value, elapsed.value),
    demoCompleted: demoCompleted.value,
    fullRoutineCompleted,
    poseScored,
    stoppedReason: stoppedReason.value || undefined,
    score:
      selectedGame.value.interaction === "camera-score" && !poseScored
        ? 0
        : activityScore.value,
    results: resultItems(),
    createdAt,
    localDate: todayKey(),
    prescriptionId: isCurrentPrescription.value
      ? sharedPatientFixture.prescription.id
      : undefined,
    prescriptionVersion: isCurrentPrescription.value
      ? sharedPatientFixture.prescription.version
      : undefined,
    prescriptionItemKey: isCurrentPrescription.value
      ? activePrescriptionItemKey.value
      : undefined,
    pointsAwarded: awarded + pendingCheckInAward.value,
    policyVersion:
      mode.value === "cardiac" ? publishedPolicy.value.version : undefined,
    assessment,
    advice,
  };
  sessions.value.unshift(session);
  selectedSessionId.value = id;
  if (
    mode.value === "cardiac" &&
    (advice.level === "attention" || advice.level === "stop")
  )
    doctorReviews.value.unshift({
      id: `REVIEW-${Date.now()}`,
      sessionId: id,
      adviceId: advice.id,
      status: "pending",
      proposedChange:
        advice.level === "stop"
          ? "暂停下一次计划，等待医生联系"
          : "下一次缩短时长或改为呼吸放松",
      createdAt,
    });
  pendingCheckInAward.value = 0;
  activePrescriptionItemKey.value = "";
  evaluateMemChallenge();
  persistState();
  detailView.value = "session-report";
}

function setPolicyMode(phase: "pre" | "post", value: AssessmentMode) {
  policyDraft.value = {
    ...policyDraft.value,
    [phase === "pre" ? "preMode" : "postMode"]: value,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}
function setPolicyField(
  field: keyof TrainingAssessmentPolicy["fields"],
  event: any,
) {
  policyDraft.value = {
    ...policyDraft.value,
    status: "draft",
    updatedAt: new Date().toISOString(),
    fields: {
      ...policyDraft.value.fields,
      [field]: Boolean(event.detail.value),
    },
  };
}
function publishPolicy() {
  const now = new Date().toISOString();
  const next = {
    ...policyDraft.value,
    version: publishedPolicy.value.version + 1,
    status: "published" as const,
    updatedAt: now,
    publishedAt: now,
    fields: { ...policyDraft.value.fields },
    sourcePriority: [...policyDraft.value.sourcePriority],
  };
  publishedPolicy.value = next;
  policyDraft.value = {
    ...next,
    fields: { ...next.fields },
    sourcePriority: [...next.sourcePriority],
  };
  persistState();
  uni.showToast({ title: `策略v${next.version}已发布`, icon: "none" });
}
function seedScenario(id: ScenarioId) {
  const previousMode = mode.value;
  mode.value = "cardiac";
  trainingStatus.value = id === "stop" ? "stopped" : "completed";
  stoppedReason.value = id === "stop" ? "胸痛或胸部不适" : "";
  preSnapshot.value = createVitalSnapshot(
    "pre",
    id === "insufficient" ? "stale" : "valid",
  );
  preVitalInputMode.value =
    id === "insufficient" ? "manual" : "device";
  postSnapshot.value = createVitalSnapshot(
    "post",
    id === "insufficient" ? "missing" : "valid",
  );
  if (id === "attention") {
    postSnapshot.value.heartRate = 101;
    postSnapshot.value.oxygenSaturation = 94;
    postSnapshot.value.borg = 6;
    postSnapshot.value.feeling = "较累";
  }
  if (id === "stop") postSnapshot.value.symptoms = ["胸痛或胸部不适"];
  elapsed.value = 180;
  selectedGameId.value = "baduanjin";
  const sessionId = `SESSION-DEMO-${Date.now()}`;
  const assessment = buildAssessment();
  const advice = buildAdvice(sessionId, assessment);
  const session: TrainingSession = {
    id: sessionId,
    exerciseId: "baduanjin",
    title: "状态测试记录",
    mode: "cardiac",
    planType: "prescription",
    status: trainingStatus.value,
    durationSeconds: 180,
    demoCompleted: true,
    stoppedReason: stoppedReason.value || undefined,
    score: id === "stop" ? 0 : 88,
    results: [{ label: "测试场景", value: id }],
    createdAt: new Date().toISOString(),
    localDate: todayKey(),
    prescriptionId: sharedPatientFixture.prescription.id,
    prescriptionVersion: sharedPatientFixture.prescription.version,
    prescriptionItemKey: prescriptionTasks.value[0]?.key,
    pointsAwarded: 0,
    policyVersion: publishedPolicy.value.version,
    assessment,
    advice,
  };
  sessions.value.unshift(session);
  selectedSessionId.value = sessionId;
  if (advice.level === "attention" || advice.level === "stop")
    doctorReviews.value.unshift({
      id: `REVIEW-${Date.now()}`,
      sessionId,
      adviceId: advice.id,
      status: "pending",
      proposedChange:
        advice.level === "stop"
          ? "暂停下一次计划，等待医生联系"
          : "下一次缩短时长或改为呼吸放松",
      createdAt: new Date().toISOString(),
    });
  mode.value = previousMode;
  detailView.value = "session-report";
  persistState();
  uni.showToast({ title: "已生成本地演示记录", icon: "none" });
}
function reviewForAdvice(adviceId: string) {
  return doctorReviews.value.find((item) => item.adviceId === adviceId);
}
function adviceForReview(review: DoctorReview) {
  return sessions.value.find((item) => item.id === review.sessionId)?.advice;
}
function resolveReview(id: string, status: ReviewStatus) {
  const review = doctorReviews.value.find((item) => item.id === id);
  if (!review) return;
  review.status = status;
  review.reviewedAt = new Date().toISOString();
  if (status === "approved") planAdjustment.value = review.proposedChange;
  persistState();
}

function simulateDeviceConnect(source: DataSource) {
  deviceConnected.value = true;
  preSnapshot.value.source = source;
  postSnapshot.value.source = source;
  const publicStepsBySource: Partial<Record<DataSource, number>> = {
    "apple-health": 5420,
    "health-connect": 5270,
    "demo-device": 5010,
  };
  const publicSteps = publicStepsBySource[source] ?? 5000;
  upsertDailyStepRecord({
    date: todayKey(),
    steps: mode.value === "cardiac" ? Math.max(0, publicSteps - 1700) : publicSteps,
    goal: DAILY_STEP_GOAL,
    source,
    quality: "valid",
    syncedAt: new Date().toISOString(),
  });
  manualStepsInput.value = "";
  persistState();
  uni.showToast({ title: "已模拟同步今日步数", icon: "none" });
}
function saveManualSteps() {
  if (hasValidDeviceSteps.value) {
    uni.showToast({ title: "设备数据已同步", icon: "none" });
    return;
  }
  const rawValue = String(manualStepsInput.value).trim();
  if (!/^\d+$/.test(rawValue)) {
    uni.showToast({ title: "请输入0–100000的整数", icon: "none" });
    return;
  }
  const steps = Number(rawValue);
  if (!Number.isInteger(steps) || steps < 0 || steps > 100000) {
    uni.showToast({ title: "步数范围为0–100000", icon: "none" });
    return;
  }
  upsertDailyStepRecord({
    date: todayKey(),
    steps,
    goal: DAILY_STEP_GOAL,
    source: "manual",
    quality: "valid",
    syncedAt: new Date().toISOString(),
  });
  manualStepsInput.value = "";
  persistState();
  uni.showToast({ title: "今日步数已保存", icon: "none" });
}
function createDemoTeam() {
  teamState.value = {
    ...createDefaultTeamState(),
    joined: true,
    name: "我的轻运动陪伴队",
    inviteCode: "XQ-MYTEAM",
    applicationStatus: "approved",
  };
  persistState();
}
function joinTeamByCode(code: string) {
  if (code.trim().toUpperCase() !== "XQ-7DAY") {
    uni.showToast({ title: "邀请码不正确", icon: "none" });
    return;
  }
  joinDemoTeam();
}
function joinDemoTeam() {
  teamState.value = {
    ...createDefaultTeamState(),
    joined: true,
    applicationStatus: "approved",
  };
  persistState();
}
function applyDemoTeam() {
  teamState.value = { ...teamState.value, applicationStatus: "pending" };
  persistState();
  uni.showToast({ title: "申请已提交，正在演示通过", icon: "none" });
  setTimeout(joinDemoTeam, 500);
}
function remindTeamMember(memberId: string) {
  if (teamState.value.reminderDates[memberId] === todayKey()) return;
  teamState.value = {
    ...teamState.value,
    reminderDates: { ...teamState.value.reminderDates, [memberId]: todayKey() },
  };
  persistState();
}
function setBuddyCycle(days: 7 | 30) {
  buddyState.value = { ...buddyState.value, cycleDays: days };
  persistState();
}
function connectDemoBuddy() {
  buddyState.value = {
    ...buddyState.value,
    connected: true,
    startedAt: todayKey(),
    applicationStatus: "approved",
  };
  persistState();
}
function applyDemoBuddy() {
  buddyState.value = { ...buddyState.value, applicationStatus: "pending" };
  persistState();
  uni.showToast({ title: "搭子申请已发出", icon: "none" });
  setTimeout(connectDemoBuddy, 500);
}
function remindBuddy() {
  if (buddyState.value.reminderSentDate === todayKey()) return;
  buddyState.value = { ...buddyState.value, reminderSentDate: todayKey() };
  persistState();
}
function focusMemUnlock() {
  uni.showToast({ title: "输入邀请码 MEM-2026", icon: "none" });
}
function unlockMem() {
  if (memCode.value.trim().toUpperCase() !== "MEM-2026") {
    uni.showToast({ title: "邀请码不正确", icon: "none" });
    return;
  }
  mem.value = {
    unlocked: true,
    inviteCode: "MEM-2026",
    unlockedAt: new Date().toISOString(),
    challengeStartDate: todayKey(),
  };
  memCode.value = "";
  persistState();
}
function convertPoints() {
  if (wallet.value.healthPoints < 100) return;
  wallet.value.healthPoints -= 100;
  wallet.value.mCoins += 5;
  persistState();
}
function canRedeem(reward: RewardItem) {
  return reward.audience === "mem"
    ? mem.value.unlocked && wallet.value.mCoins >= reward.cost
    : wallet.value.healthPoints >= reward.cost;
}
function confirmRedeem(reward: RewardItem) {
  if (!canRedeem(reward)) return;
  uni.showModal({
    title: "确认兑换",
    content: `使用 ${reward.cost}${reward.audience === "mem" ? "M币" : "健康积分"}兑换“${reward.name}”？`,
    success: (result) => {
      if (result.confirm) redeemReward(reward);
    },
  });
}
function redeemReward(reward: RewardItem) {
  if (!canRedeem(reward)) return;
  const currency = reward.audience === "mem" ? "m-coins" : "health-points";
  if (currency === "m-coins") wallet.value.mCoins -= reward.cost;
  else wallet.value.healthPoints -= reward.cost;
  redemptions.value.unshift({
    id: `REDEEM-${Date.now()}`,
    rewardId: reward.id,
    rewardName: reward.name,
    currency,
    cost: reward.cost,
    quantity: 1,
    status: "completed",
    createdAt: new Date().toISOString(),
  });
  persistState();
  uni.showToast({ title: "演示兑换成功", icon: "none" });
}
function calculateMemChallengeDays() {
  let count = 0;
  let cursor = startOfLocalDay(new Date());
  while (true) {
    const key = localDateKey(cursor);
    const qualified = sessions.value.some(
      (item) =>
        item.exerciseId === "baduanjin" &&
        item.status === "completed" &&
        item.fullRoutineCompleted === true &&
        item.poseScored === true &&
        item.demoCompleted === false &&
        Number.isFinite(item.score) &&
        item.score > 0 &&
        item.localDate === key,
    );
    if (!qualified) break;
    count += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return count;
}
function evaluateMemChallenge() {
  if (!mem.value.unlocked) return;
  const days = calculateMemChallengeDays();
  if (
    days > 0 &&
    days % 7 === 0 &&
    mem.value.lastRewardCycleEnd !== todayKey()
  ) {
    wallet.value.mCoins += 20;
    mem.value.lastRewardCycleEnd = todayKey();
    uni.showToast({ title: "MEM连续7天 +20M币", icon: "none" });
  }
}

function normalizePublicHealthProfile(value: any): PublicHealthProfile {
  const name =
    typeof value?.name === "string" ? value.name.trim().slice(0, 20) : "";
  const age = Number(value?.age);
  return {
    name: name || "运动伙伴",
    age: Number.isInteger(age) && age >= 18 && age <= 100 ? age : null,
  };
}

function persistState() {
  uni.setStorageSync(STORAGE_KEY, {
    schemaVersion: 7,
    ready: appReady.value,
    mode: mode.value,
    healthGoal: healthGoal.value,
    publicHealthProfile: publicHealthProfile.value,
    wallet: wallet.value,
    mem: mem.value,
    redemptions: redemptions.value,
    dailyStepRecords: dailyStepRecords.value,
    checkIns: checkIns.value,
    teamState: teamState.value,
    buddyState: buddyState.value,
    sessions: sessions.value,
    rewardLedger: rewardLedger.value,
    deviceConnected: deviceConnected.value,
    policyDraft: policyDraft.value,
    publishedPolicy: publishedPolicy.value,
    doctorReviews: doctorReviews.value,
    planAdjustment: planAdjustment.value,
    selfSelectedGameId: selfSelectedGameId.value,
    expandedCategoryId: expandedCategoryId.value,
  });
}
function resetPrototype() {
  stopTimer();
  uni.removeStorageSync(STORAGE_KEY);
  appReady.value = false;
  onboardingStep.value = "mode";
  mode.value = "public";
  healthGoal.value = "habit";
  activeNav.value = "today";
  todayPageIndex.value = TODAY_PAGE_EXERCISE;
  prescriptionSlide.value = 0;
  prescriptionGestureActive.value = false;
  detailView.value = "none";
  wallet.value = { healthPoints: 160, mCoins: 0 };
  mem.value = { unlocked: false, inviteCode: "MEM-2026" };
  redemptions.value = [];
  dailyStepRecords.value = buildSeedDailySteps();
  manualStepsInput.value = "";
  checkIns.value = buildSeedCheckIns();
  teamState.value = createDefaultTeamState();
  buddyState.value = createDefaultBuddyState();
  sessions.value = [];
  selfSelectedGameId.value = "";
  expandedCategoryId.value = "";
  rewardLedger.value = {
    date: todayKey(),
    exerciseIds: [],
    prescriptionBonusAwarded: false,
  };
  pendingGardenFeedback.value = null;
  deviceConnected.value = false;
  policyDraft.value = createDefaultPolicy();
  publishedPolicy.value = createDefaultPolicy();
  doctorReviews.value = [];
  planAdjustment.value = "";
  publicHealthProfile.value = { name: "运动伙伴", age: null };
  syncPublicProfileDraft();
}
onMounted(() => {
  const saved = uni.getStorageSync(STORAGE_KEY);
  if (saved?.ready) {
    mode.value = saved.mode === "cardiac" ? "cardiac" : "public";
    healthGoal.value =
      saved.healthGoal === "weight"
        ? "weight"
        : saved.healthGoal === "cardiac"
          ? "cardiac"
          : "habit";
    publicHealthProfile.value = normalizePublicHealthProfile(
      saved.publicHealthProfile,
    );
    syncPublicProfileDraft();
    wallet.value = saved.wallet
      ? {
          healthPoints: Number(saved.wallet.healthPoints) || 0,
          mCoins: Number(saved.wallet.mCoins) || 0,
        }
      : { healthPoints: Number(saved.points) || 160, mCoins: 0 };
    mem.value = saved.mem ? { ...mem.value, ...saved.mem } : mem.value;
    redemptions.value = Array.isArray(saved.redemptions)
      ? saved.redemptions.map((item: any) => ({
          ...item,
          quantity: item.quantity || 1,
          status: "completed",
        }))
      : [];
    dailyStepRecords.value = migrateDailyStepRecords(saved);
    checkIns.value = migrateCheckIns(saved);
    teamState.value = saved.teamState
      ? {
          ...createDefaultTeamState(),
          ...saved.teamState,
          reminderDates: saved.teamState.reminderDates || {},
        }
      : createDefaultTeamState();
    buddyState.value = saved.buddyState
      ? { ...createDefaultBuddyState(), ...saved.buddyState }
      : createDefaultBuddyState();
    sessions.value = Array.isArray(saved.sessions)
      ? saved.sessions.map((item: any) => ({
          ...item,
          localDate: item.localDate || localDateKey(new Date(item.createdAt)),
          fullRoutineCompleted: item.fullRoutineCompleted === true,
          poseScored: item.poseScored === true,
        }))
      : [];
    selfSelectedGameId.value = exerciseGames.some(
      (item) => item.id === saved.selfSelectedGameId,
    )
      ? saved.selfSelectedGameId
      : "";
    expandedCategoryId.value = exerciseCategories.some(
      (item) => item.id === saved.expandedCategoryId,
    )
      ? saved.expandedCategoryId
      : "";
    rewardLedger.value = saved.rewardLedger?.date
      ? saved.rewardLedger
      : rewardLedger.value;
    deviceConnected.value = Boolean(saved.deviceConnected);
    publishedPolicy.value = saved.publishedPolicy
      ? {
          ...createDefaultPolicy(),
          ...saved.publishedPolicy,
          fields: {
            ...createDefaultPolicy().fields,
            ...saved.publishedPolicy.fields,
          },
        }
      : createDefaultPolicy();
    policyDraft.value = saved.policyDraft
      ? {
          ...publishedPolicy.value,
          ...saved.policyDraft,
          fields: {
            ...publishedPolicy.value.fields,
            ...saved.policyDraft.fields,
          },
        }
      : {
          ...publishedPolicy.value,
          fields: { ...publishedPolicy.value.fields },
        };
    doctorReviews.value = Array.isArray(saved.doctorReviews)
      ? saved.doctorReviews
      : [];
    planAdjustment.value = saved.planAdjustment || "";
    appReady.value = true;
    activeNav.value = "today";
    todayPageIndex.value = TODAY_PAGE_EXERCISE;
    focusFirstIncompletePrescription();
    persistState();
  }
});
onUnmounted(stopTimer);
</script>

<style lang="scss" src="./index.scss"></style>
