/// <reference types="Cypress" />

import { mount } from "@vue/test-utils"
import Stub from "../../src/views/Debug/Stub.vue";

context('Vue Testing', () => {
    describe('stub component', function() {
        it('must be mountable', () => {
            const wrapper = mount(Stub);
            expect(wrapper.html()).to.equal('<span>hello</span>')
        })
    })
})
