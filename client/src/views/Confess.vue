<template>
  <div class="confess-container">
    <ForgivenessAnimation
      :visible="showAnimation"
      @complete="handleAnimationComplete"
    />

    <div class="card confess-card" v-if="!showAnimation">
      <div class="card-header">
        <span class="icon">🕊️</span>
        <h2>倾诉你的秘密</h2>
        <p class="subtitle">这里是一个安全的空间，你的秘密将被匿名保存并宽恕</p>
      </div>

      <div class="form-group">
        <textarea
          v-model="secretContent"
          class="secret-input"
          placeholder="在这里写下你想说的话...&#10;&#10;也许是一件愧疚的事，&#10;也许是一个深藏的秘密，&#10;也许只是想找个地方倾诉..."
          rows="8"
          :disabled="submitting"
        ></textarea>
        <div class="char-count">
          {{ secretContent.length }} / 500
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button
          class="btn btn-primary submit-btn"
          @click="submitSecret"
          :disabled="submitting || !secretContent.trim() || secretContent.length > 500"
        >
          <span v-if="submitting">
            <span class="btn-spinner"></span>
            提交中...
          </span>
          <span v-else>
            🌸 获得宽恕
          </span>
        </button>
      </div>

      <div class="tips">
        <p>💡 提示：你的秘密会被匿名保存，没有人会知道是谁分享的</p>
        <p>🌈 提交后，它将被自动标记为「已宽恕」</p>
      </div>
    </div>

    <div class="card complete-card" v-else-if="showComplete">
      <div class="complete-content">
        <span class="complete-icon">💜</span>
        <h2>宽恕已完成</h2>
        <p>你的秘密已经被温柔地保存</p>
        <p>愿你获得内心的平静</p>

        <div class="receipt-card" v-if="receiptData">
          <div class="receipt-header">
            <span class="receipt-icon">📜</span>
            <h3>匿名回执</h3>
            <span class="receipt-badge">不可反查</span>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-info">
            <div class="receipt-row">
              <span class="receipt-label">倾诉编号</span>
              <span class="receipt-value receipt-id">{{ receiptData.id }}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">提交时间</span>
              <span class="receipt-value">{{ receiptData.formattedTime }}</span>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-comfort">
            <p class="comfort-text">「{{ receiptData.comfortMessage }}」</p>
          </div>
          <div class="receipt-tip">
            <span>🔒</span>
            <span>此回执仅用于留念，无法通过编号查询任何身份信息</span>
          </div>
          <button class="btn btn-copy" @click="copyReceipt" :disabled="copied">
            <span v-if="copied">✅ 已复制</span>
            <span v-else>📋 复制回执</span>
          </button>
        </div>

        <div class="complete-actions">
          <button class="btn btn-secondary" @click="resetForm">
            再分享一个
          </button>
          <button class="btn btn-primary" @click="goHome">
            回到首页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ForgivenessAnimation from '../components/ForgivenessAnimation.vue'

const comfortMessages = [
  '过去的就让它过去吧，未来还很长，愿你轻装前行',
  '能说出来就是最大的勇气，你已经很棒了',
  '每个人都有不完美的一面，接纳自己才是真正的成长',
  '这份重量从此不必独自承担，你值得被温柔以待',
  '时间会治愈一切，而你已经迈出了最难的第一步',
  '放下不是遗忘，而是选择不再被它束缚',
  '你并不孤单，总有人愿意理解和包容你的全部',
  '真正的强大，是敢于直面并放下过去',
  '所有的经历都是成长的养分，包括那些让你愧疚的',
  '宽恕自己，是给未来最好的礼物'
]

const router = useRouter()
const secretContent = ref('')
const submitting = ref(false)
const error = ref('')
const showAnimation = ref(false)
const showComplete = ref(false)
const receiptData = ref(null)
const copied = ref(false)
let tempSecretData = null

function formatDateTime(isoString) {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function generateShortId(uuid) {
  return uuid.replace(/-/g, '').slice(0, 16).toUpperCase()
}

function getRandomComfortMessage() {
  const index = Math.floor(Math.random() * comfortMessages.length)
  return comfortMessages[index]
}

async function submitSecret() {
  if (!secretContent.value.trim()) {
    error.value = '请输入你想倾诉的内容'
    return
  }

  if (secretContent.value.length > 500) {
    error.value = '内容不能超过500字'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const response = await fetch('/api/secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: secretContent.value
      })
    })

    const data = await response.json()

    if (response.ok && data.secret) {
      tempSecretData = data.secret
      showAnimation.value = true
    } else {
      error.value = data.error || '提交失败，请稍后重试'
      submitting.value = false
    }
  } catch (err) {
    console.error('提交失败:', err)
    error.value = '无法连接到服务器，请稍后重试'
    submitting.value = false
  }
}

function handleAnimationComplete() {
  if (tempSecretData) {
    receiptData.value = {
      id: generateShortId(tempSecretData.id),
      fullId: tempSecretData.id,
      formattedTime: formatDateTime(tempSecretData.createdAt),
      comfortMessage: getRandomComfortMessage()
    }
    tempSecretData = null
  }
  showAnimation.value = false
  showComplete.value = true
}

async function copyReceipt() {
  if (!receiptData.value) return

  const receiptText = `
【匿名倾诉回执】
━━━━━━━━━━━━━━━━━━━
倾诉编号：${receiptData.value.id}
提交时间：${receiptData.value.formattedTime}
━━━━━━━━━━━━━━━━━━━
安慰语：「${receiptData.value.comfortMessage}」
━━━━━━━━━━━━━━━━━━━
此回执仅用于留念，无法反查身份信息
  `.trim()

  try {
    await navigator.clipboard.writeText(receiptText)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    const textarea = document.createElement('textarea')
    textarea.value = receiptText
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (e) {
      error.value = '复制失败，请手动选择文本复制'
    }
    document.body.removeChild(textarea)
  }
}

function resetForm() {
  secretContent.value = ''
  showComplete.value = false
  error.value = ''
  submitting.value = false
  receiptData.value = null
  copied.value = false
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.confess-container {
  width: 100%;
  max-width: 600px;
}

.confess-card {
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.icon {
  font-size: 56px;
  display: block;
  margin-bottom: 15px;
}

.card-header h2 {
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 25px;
  position: relative;
}

.secret-input {
  width: 100%;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  transition: all 0.3s ease;
  line-height: 1.8;
  background: #fafafa;
}

.secret-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.secret-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secret-input::placeholder {
  color: #aaa;
  line-height: 1.8;
}

.char-count {
  position: absolute;
  bottom: 10px;
  right: 15px;
  font-size: 13px;
  color: #999;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid #dc2626;
}

.form-actions {
  text-align: center;
  margin-bottom: 30px;
}

.submit-btn {
  min-width: 200px;
  font-size: 18px;
  padding: 15px 40px;
}

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tips {
  background: linear-gradient(135deg, #fef9e7 0%, #fdf2e9 100%);
  padding: 20px;
  border-radius: 15px;
  border-left: 4px solid #f59e0b;
}

.tips p {
  color: #78350f;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.6;
}

.tips p:last-child {
  margin-bottom: 0;
}

.complete-card {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.complete-content {
  text-align: center;
  padding: 30px 20px;
}

.complete-icon {
  font-size: 72px;
  display: block;
  margin-bottom: 20px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.complete-content h2 {
  color: #333;
  font-size: 28px;
  margin-bottom: 15px;
}

.complete-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 10px;
}

.complete-actions {
  margin-top: 40px;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.receipt-card {
  margin-top: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 28px;
  text-align: left;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  animation: receiptSlideUp 0.5s ease;
}

@keyframes receiptSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.receipt-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  position: relative;
}

.receipt-icon {
  font-size: 28px;
}

.receipt-header h3 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.receipt-badge {
  position: absolute;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.receipt-divider {
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    rgba(255, 255, 255, 0.4),
    rgba(255, 255, 255, 0.4) 6px,
    transparent 6px,
    transparent 12px
  );
  margin: 16px 0;
}

.receipt-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.receipt-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.receipt-value {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.receipt-id {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
}

.receipt-comfort {
  margin: 5px 0;
}

.comfort-text {
  color: white;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 500;
  margin: 0;
  text-align: center;
  font-style: italic;
}

.receipt-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  border-radius: 10px;
  margin-top: 8px;
}

.receipt-tip span:first-child {
  font-size: 14px;
  flex-shrink: 0;
}

.receipt-tip span:last-child {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  line-height: 1.5;
}

.btn-copy {
  width: 100%;
  margin-top: 18px;
  background: white;
  color: #667eea;
  border: none;
  font-weight: 600;
  padding: 12px 24px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.btn-copy:hover:not(:disabled) {
  background: #f0f0ff;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.btn-copy:active:not(:disabled) {
  transform: translateY(0);
}

.btn-copy:disabled {
  opacity: 0.8;
  cursor: default;
  background: #f0f0ff;
}
</style>
