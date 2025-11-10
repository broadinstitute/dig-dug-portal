<template>
    <div class="front-page-body">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div v-if="$parent.diseaseGroup">
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <b-card title="Login" class="shadow-sm">
                            <form name="login-form" >
                                <div class="mb-3">
                                    <label for="username">Username: </label>
                                    <input type="text" id="username" v-model="$parent.input.username" />
                                </div>
                                <div class="mb-3">
                                <label for="password">Password: </label>
                                <input type="password" id="password" v-model="$parent.input.password" />
                                </div>
                                <button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "$parent.SignIn($parent.input.username, $parent.input.password)">
                                    Login
                                </button>
                                &nbsp;&nbsp;<a href="changepass.html">Change Password</a>
                            </form>
                        </b-card>
                    </div>
                </div>
            </div>
        </div>

        <div><p>&nbsp;</p></div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style scoped>
h4.white {
    color: white;
}
</style>
