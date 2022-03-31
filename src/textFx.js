import gsap from 'gsap'
import * as THREE from 'three'
import {Text} from 'troika-three-text'
import qadata from './qadata.js'
import {Vector3} from "three";

class TextGl
{
    constructor(text)
    {
        this.text= new Text()

        if(text) { this.text.text = text }
        this.text.fontSize = 0.06
        this.text.position.z = 0.1
        this.text.font = '/fonts/SourceHanSansHWSC-Regular.otf'
        this.text.color = new THREE.Color('#ffffff')
    }
    setText(text)
    {
        this.text.text = text
    }
    getLength()
    {
        // console.log(this.text.text.length)
        return this.text.text.length
    }
    appear(from, to , duration, tl, position)
    {

    }
    highlight(duration)
    {

    }
    disHighlight(duration)
    {

    }
    disappear(from ,to ,duration, tl, position)
    {

    }
}
class OptionPosition
{
    constructor(radius = 1, count = 4) {
        this.radius = radius
        this.count = count
        this.positions = this.getUniformPositions(this.count,this.radius)
    }
    getUniformPositions(count, radius) {
    var vectors = [];
    var inc = Math.PI * (3 - Math.sqrt(5));
    var x = 0;
    var y = 0;
    var z = 0;
    var r = 0;
    var phi = 0;
    for (var k = 0; k < count; k++) {
        var off = 2 / count;
        var vec3 = new THREE.Vector3();
        y = k * off - 1 + off / 2;
        r = Math.sqrt(1 - y * y);
        phi = k * inc;
        x = Math.cos(phi) * r;
        z = (0, Math.sin(phi) * r);
        x *= radius;
        y *= radius;
        z *= radius;
        vec3.x = x;
        vec3.y = y;
        vec3.z = z;
        vectors.push(vec3);
    }
    return vectors;
    }
    refreshPostions()
    {
        this.positions = this.getUniformPositions(this.count,this.radius)
        console.log(this.positions)
    }

}

class OptionGroup
{
    constructor(optiondata = qadata,question_id, origin_radius = 2,target_radius = 1, answer_count = 4) {
        this.rawOption = optiondata
        this.answer_count = answer_count
        this.getCurrentQA(question_id)
        this.option_origin_postitions= this.getOptionPositions(origin_radius,answer_count)
        this.option_target_positions= this.getOptionPositions(target_radius,answer_count)
        this.tl = new gsap.timeline()
    }
    getCurrentQA(ID)
    {
        this.ID =this.rawOption[ID].ID
        this.question = this.rawOption[ID].Question
        this.answer_list= this.rawOption[ID].Answer
    }
    getOptionPositions(radius,count = 4)
    {
        // return OptionPosition(1,4).positions
        console.log(OptionPosition(1,4).positions)
    }
    initTextGL()
    {

    }
    selectOption()
    {
    }
    appear()
    {
        for(let i=0;i<this.answer_count;i++)
        {
            let ani_position = {position: this.option_origin_postitions}
           this.tl.fromTo(ani_position,{ position:this.option_origin_postitions },
         {
                    position:this.option_target_positions,
                    duration:3,
                    onUpdate:()=>
                    {

                    }
               })

        }
    }
    disappear()
    {
    }
}

export {TextGl, OptionGroup }

