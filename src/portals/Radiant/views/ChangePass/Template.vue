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
                        <b-card title="Change Password" class="shadow-sm">
                            <form name="login-form" >
                                <div class="mb-3">
                                    <label for="username">Username: </label>
                                    <input type="text" id="username" v-model="$parent.input.username" />
                                </div>
                                <div class="mb-3">
                                <label for="password">Old Password: </label>
                                <input type="password" id="password" v-model="$parent.input.password" />
                                </div>
                                <div class="mb-3">
                                <label for="npassword">New Password: </label>
                                <input type="password" id="npassword" v-model="$parent.input.npassword" />
                                </div>
                                <div class="mb-3">
                                <label for="npassword2">Confirm New Password: </label>
                                <input type="password" id="npassword2" v-model="$parent.input.npassword2" />
                                </div>
                                <div class="mb-3">
                                    <p style="color:red">{{ $parent.input.errormessage }}</p>
                                </div>
                                <button class="btn btn-outline-dark" type="submit" v-on:click.prevent = "
                                    if( $parent.input.npassword == $parent.input.npassword2){
                                        $parent.ChangePass($parent.input.username, $parent.input.password, $parent.input.npassword, $parent.input.npassword2);
                                    } else {
                                        $parent.input.errormessage = '* Please confirm the new password.';
                                    }
                                    ">
                                    Change Password
                                </button>
                                &nbsp;&nbsp;<a href="login.html">Back to Login</a>
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
