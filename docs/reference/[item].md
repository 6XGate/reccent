---
title: {{ $params.title }}
layout: doc
---

<script setup lang="ts">
import { useData } from 'vitepress'
import ContentPage from '../.vitepress/api/views/page'

const { params } = useData()
</script>

<ContentPage :page="params.page"/>
