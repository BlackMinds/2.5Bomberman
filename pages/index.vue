<script setup lang="ts">
const { token } = useAuth()
navigateTo(token.value ? '/lobby' : '/auth/login')
</script>

