<script setup>
const { token } = useAuth()
navigateTo(token.value ? '/lobby' : '/auth/login')
</script>
