<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>

        <div class="pkb-body">
            <LigerBrowser :config="$parent.liger_config" />
        </div>

        <pkb-footer></pkb-footer>
    </div>
</template>
