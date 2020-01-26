<template>
    <div>
        <table width="100%">
            <tr>
                <td valign="top">
                    <table class="table table-striped" style="margin-top:20px">
                        <thead class="thead-dark">
                            <th>var_id</th>
                            <th>p_value</th>
                            <th>standard_error</th>
                            <th>beta</th>
                        </thead>
                        <tbody>
                            <tr v-for="(row) in $store.state.graphAnnotationByRegion">
                                <td>{{ row.var_id }}</td>
                                <td>{{ row.p_value }}</td>
                                <td>{{ row.standard_error }}</td>
                                <td>{{ row.beta }}</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</template>
