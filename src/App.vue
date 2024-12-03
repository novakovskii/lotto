<template>
  <button class="button" @click="$router.push({name: 'Control'})">Go</button>
  <router-view />
</template>



<style>
  body {
    width: 100vw;
    height: 100vh;
  }

  #app {
    width: 100%;
    height: 100%;
    display: flex;
  }

  .button {
    position: absolute;
    z-index: 9999;
    right: 0;
    top: 0;
    cursor: pointer;
    opacity: 0;
  }
</style>